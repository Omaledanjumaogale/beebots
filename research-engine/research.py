"""Reproducible research-only baseline. Python 3.10+, standard library only."""
import argparse
import csv
import hashlib
import json
import math
import os
import platform
import statistics
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

FEATURES = ['return_1', 'return_3', 'return_12', 'volatility_20']


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read_candles(path):
    rows = []
    with open(path, newline='', encoding='utf-8-sig') as stream:
        reader = csv.DictReader(stream)
        if not set(['timestamp', 'open', 'high', 'low', 'close', 'volume']).issubset(reader.fieldnames or []):
            raise ValueError('CSV requires timestamp,open,high,low,close,volume')
        for raw in reader:
            row = {key: float(raw[key]) for key in ['open', 'high', 'low', 'close', 'volume']}
            row['timestamp'] = int(raw['timestamp'])
            if any(not math.isfinite(value) for value in row.values()):
                raise ValueError('Non-finite candle')
            if min(row[key] for key in ['open', 'high', 'low', 'close']) <= 0 or row['volume'] < 0:
                raise ValueError('Invalid price or volume')
            if row['low'] > min(row['open'], row['close']) or row['high'] < max(row['open'], row['close']) or row['low'] > row['high']:
                raise ValueError('Inconsistent OHLC candle')
            if rows and row['timestamp'] <= rows[-1]['timestamp']:
                raise ValueError('CSV must be strictly chronological, without duplicates')
            rows.append(row)
    if len(rows) < 200:
        raise ValueError('At least 200 closed candles required')
    intervals = [b['timestamp'] - a['timestamp'] for a, b in zip(rows, rows[1:])]
    if len(set(intervals)) != 1 or intervals[0] <= 0:
        raise ValueError('Missing or irregular bars: quarantine/repair upstream')
    if rows[-1]['timestamp'] + intervals[0] > int(time.time() * 1000):
        raise ValueError('Last candle is not closed at current time')
    return rows


def feature_at(rows, index):
    """Only reads prices through index; decision happens after candle closes."""
    if index < 20:
        raise ValueError('Feature warmup requires 20 prior bars')
    closes = [row['close'] for row in rows[index-20:index+1]]
    returns = [math.log(b/a) for a, b in zip(closes, closes[1:])]
    return [returns[-1], math.log(closes[-1]/closes[-4]), math.log(closes[-1]/closes[-13]), statistics.pstdev(returns)]


def samples(rows, horizon):
    return [{'index': i, 'label_end': i+horizon, 'timestamp': rows[i]['timestamp'],
             'x': feature_at(rows, i), 'y': int(rows[i+horizon]['close'] > rows[i+1]['open']),
             'return': rows[i+horizon]['close']/rows[i+1]['open']-1}
            for i in range(20, len(rows)-horizon)]


def purged_before(data, boundary):
    """Train labels must finish strictly before first evaluation feature timestamp."""
    return [sample for sample in data if sample['label_end'] < boundary]


def sigmoid(value):
    value = max(-40, min(40, value))
    return 1/(1+math.exp(-value))


def fit(data, iterations=400, learning_rate=0.08, regularization=0.01):
    if len(data) < 40:
        raise ValueError('Insufficient purged training samples')
    means = [statistics.mean(row['x'][j] for row in data) for j in range(4)]
    scales = [max(1e-12, statistics.pstdev(row['x'][j] for row in data)) for j in range(4)]
    xs = [[1]+[(value-means[j])/scales[j] for j, value in enumerate(row['x'])] for row in data]
    weights = [0.0]*5
    for _ in range(iterations):
        gradients = [0.0]*5
        for row, x in zip(data, xs):
            error = sigmoid(sum(a*b for a, b in zip(weights, x)))-row['y']
            for j in range(5):
                gradients[j] += error*x[j]
        weights = [w-learning_rate*(gradients[j]/len(data)+(regularization*w if j else 0)) for j, w in enumerate(weights)]
    return {'features': FEATURES, 'mean': means, 'scale': scales, 'weights': weights,
            'training_samples': len(data), 'training_last_label_index': max(row['label_end'] for row in data)}


def probability(model, x):
    normalized = [1]+[(value-model['mean'][j])/model['scale'][j] for j, value in enumerate(x)]
    return sigmoid(sum(a*b for a, b in zip(model['weights'], normalized)))


def evaluate(model, data, horizon, cost_bps=20, threshold=0.6):
    predictions = [probability(model, row['x']) for row in data]
    brier = statistics.mean((p-row['y'])**2 for p, row in zip(predictions, data))
    log_loss = -statistics.mean(row['y']*math.log(max(1e-12,p))+(1-row['y'])*math.log(max(1e-12,1-p)) for p,row in zip(predictions,data))
    # Long/cash only. Non-overlapping horizons bound capital reuse. Direction is
    # forecast quality; next-bar open entry is still only a fill proxy.
    equity = peak = 1.0
    drawdown = 0.0
    trades = wins = opportunities = 0
    next_index = -1
    for p, row in zip(predictions, data):
        if row['index'] < next_index:
            continue
        opportunities += 1
        next_index = row['index']+horizon
        if p < threshold:
            continue
        net = row['return']-cost_bps/10000
        equity *= max(0, 1+net)
        peak = max(peak, equity)
        drawdown = max(drawdown, 1-equity/peak)
        trades += 1
        wins += net > 0
    base_rate = statistics.mean(row['y'] for row in data)
    return {'samples': len(data), 'brier': brier, 'log_loss': log_loss,
            'accuracy_at_half': statistics.mean((p >= .5)==row['y'] for p,row in zip(predictions,data)),
            'observed_up_frequency': base_rate,
            'training_prevalence_brier': statistics.mean((model['training_up_frequency']-row['y'])**2 for row in data),
            'nonoverlapping_opportunities': opportunities, 'paper_return_proxy': equity-1,
            'maximum_drawdown_proxy': drawdown, 'long_entries': trades,
            'abstention_fraction': 1-trades/opportunities, 'net_win_fraction': wins/trades if trades else None,
            'round_trip_cost_bps': cost_bps, 'entry_threshold': threshold}


def train(args):
    rows = read_candles(args.csv)
    data = samples(rows, args.horizon)
    holdout_start = int(len(data)*.8)
    holdout = data[holdout_start:]
    development = purged_before(data[:holdout_start], holdout[0]['index'])
    folds = []
    # Fixed hyperparameters; holdout is never used for fitting or tuning.
    for fraction in [.5, .65, .8]:
        start = int(len(development)*fraction)
        end = min(len(development), start+max(20, int(len(development)*.15)))
        validation = development[start:end]
        training = purged_before(development[:start], validation[0]['index'])
        model = fit(training, args.iterations, args.learning_rate, args.regularization)
        model['training_up_frequency'] = statistics.mean(row['y'] for row in training)
        folds.append({'train_end_label_index': model['training_last_label_index'],
                      'validation_start_index': validation[0]['index'],
                      'metrics': evaluate(model, validation, args.horizon, args.cost_bps, args.threshold)})
    training = purged_before(development, holdout[0]['index'])
    model = fit(training, args.iterations, args.learning_rate, args.regularization)
    model['training_up_frequency'] = statistics.mean(row['y'] for row in training)
    try:
        revision = subprocess.check_output(['git','rev-parse','HEAD'], cwd=Path(__file__).parent, text=True, stderr=subprocess.DEVNULL).strip()
    except (subprocess.SubprocessError, OSError):
        revision = 'unavailable'
    configuration = {key:value for key,value in vars(args).items() if key not in ['function','out']}
    output = {'state': 'shadow-only', 'trained': True, 'approved': False,
              'model_family': 'regularized logistic direction baseline',
              'manifest': {'dataset_sha256': digest(args.csv), 'code_sha256': digest(__file__), 'git_revision': revision,
                           'python': platform.python_version(), 'configuration': configuration, 'seed': None,
                           'deterministic_full_batch': True, 'created_at_utc': datetime.now(timezone.utc).isoformat(),
                           'first_timestamp_ms': rows[0]['timestamp'], 'last_timestamp_ms': rows[-1]['timestamp'],
                           'bars':len(rows), 'bar_interval_ms': rows[1]['timestamp']-rows[0]['timestamp'],
                           'dataset_rights': args.rights, 'source': args.source},
              'walk_forward': folds, 'holdout': {'start_index': holdout[0]['index'], 'metrics': evaluate(model, holdout, args.horizon, args.cost_bps,args.threshold)},
              'model':model,
              'limitations':['No execution approval; no guarantee of edge', 'Next-bar open to horizon-close proxy; live paper validation required',
                             'Fixed cost assumption excludes depth, funding, queueing and latency', 'Repeated inspection consumes holdout; supply new untouched data before release decisions',
                             'Only a baseline; no LLM model weights or copied proprietary model']}
    # Exclusive file creation prevents overwriting experiment history.
    out=Path(args.out); out.parent.mkdir(parents=True,exist_ok=True)
    with out.open('x',encoding='utf-8') as stream:
        json.dump(output,stream,indent=2,allow_nan=False)
    print(json.dumps({'artifact':str(out),'sha256':digest(out),'state':output['state'],'trained':True}))


def fetch(args):
    if args.symbol not in ['BTC-USDT','ETH-USDT','SOL-USDT']:
        raise ValueError('Only liquid BTC/ETH/SOL USDT spot instruments supported')
    candles = {}
    cursor = None
    for _ in range(args.pages):
        query={'instId':args.symbol,'bar':args.bar,'limit':'100'}
        if cursor:
            query['after']=cursor
        url='https://www.okx.com/api/v5/market/history-candles?'+urllib.parse.urlencode(query)
        request=urllib.request.Request(url,headers={'User-Agent':'OmieBotResearch/0.1'})
        with urllib.request.urlopen(request, timeout=15) as response:
            result=json.load(response)
        if result.get('code')!='0':
            raise ValueError('OKX history request rejected: '+str(result.get('msg')))
        batch=result.get('data',[])
        if not batch:
            break
        for row in batch:
            if len(row)>=9 and row[8]=='1':
                candles[int(row[0])]=row[:6]
        oldest=str(min(int(row[0]) for row in batch))
        if cursor==oldest:
            break
        cursor=oldest
        time.sleep(.3)
    if not candles:
        raise ValueError('No confirmed closed candles returned')
    out=Path(args.out);out.parent.mkdir(parents=True,exist_ok=True)
    with out.open('x',newline='',encoding='utf-8') as stream:
        writer=csv.writer(stream);writer.writerow(['timestamp','open','high','low','close','volume'])
        writer.writerows(candles[key] for key in sorted(candles))
    print(json.dumps({'dataset':str(out),'rows':len(candles),'sha256':digest(out),'source':'OKX public history-candles','symbol':args.symbol,'bar':args.bar,'confirmed_only':True}))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    commands=parser.add_subparsers(dest='command',required=True)
    training=commands.add_parser('train')
    training.add_argument('--csv',required=True);training.add_argument('--out',required=True)
    training.add_argument('--source',required=True);training.add_argument('--rights',required=True)
    training.add_argument('--horizon',type=int,default=3);training.add_argument('--iterations',type=int,default=400)
    training.add_argument('--learning-rate',type=float,default=.08);training.add_argument('--regularization',type=float,default=.01)
    training.add_argument('--cost-bps',type=float,default=20);training.add_argument('--threshold',type=float,default=.6)
    training.set_defaults(function=train)
    fetching=commands.add_parser('fetch');fetching.add_argument('--symbol',default='BTC-USDT')
    fetching.add_argument('--bar',choices=['1m','5m','15m','1H','4H','1D'],default='5m')
    fetching.add_argument('--pages',type=int,default=5);fetching.add_argument('--out',required=True);fetching.set_defaults(function=fetch)
    args=parser.parse_args()
    if args.command=='train' and not (1<=args.horizon<=100 and 1<=args.iterations<=2000 and 0<args.learning_rate<=1 and 0<=args.regularization<=1 and 0<=args.cost_bps<=1000 and .5<args.threshold<1):
        parser.error('Training parameters outside bounded limits')
    if args.command=='fetch' and not 1<=args.pages<=50:
        parser.error('Pages must be 1..50')
    args.function(args)


if __name__=='__main__':
    main()
