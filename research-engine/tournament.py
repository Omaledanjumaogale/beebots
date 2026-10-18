"""Offline, research-only tournament. No networking or execution capability."""
import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import platform
import statistics

import research


def baseline_signal(name, rows, index):
    """Long/cash signals use only closed bars through index."""
    closes = [r['close'] for r in rows[index-20:index+1]]
    if len(closes) != 21:
        raise ValueError('Twenty prior bars required')
    mean = statistics.mean(closes[-20:])
    if name == 'drift':
        return closes[-1] > mean and closes[-1] > closes[-4]
    if name == 'rebound':
        return closes[-1] < mean * .99 and closes[-1] > closes[-2]
    if name == 'breaker':
        return closes[-1] > max(closes[:-1])
    raise ValueError('Unknown baseline')


def score(rows, data, signal, horizon, cost_bps):
    equity = peak = 1.0
    drawdown = 0.0
    trades = wins = opportunities = 0
    next_index = -1
    for sample in data:
        i = sample['index']
        if i < next_index:
            continue
        opportunities += 1
        # Reserve horizon even when abstaining, keeping all candidates on the
        # same non-overlapping decision grid.
        next_index = i + horizon
        if not signal(i):
            continue
        net = sample['return'] - cost_bps / 10000
        equity *= max(0, 1 + net)
        peak = max(peak, equity)
        drawdown = max(drawdown, 1-equity/peak)
        trades += 1
        wins += net > 0
    # Mark buy-and-hold on every bar, with one entry and one exit cost.
    first, last = data[0]['index']+1, data[-1]['label_end']
    half_cost = cost_bps/20000
    benchmark_peak = 1.0
    benchmark_drawdown = 0.0
    entry = rows[first]['open']
    for bar in rows[first:last+1]:
        mark = (1-half_cost)*bar['close']/entry
        benchmark_peak = max(benchmark_peak, mark)
        benchmark_drawdown = max(benchmark_drawdown, 1-mark/benchmark_peak)
    benchmark_return = (1-half_cost)*rows[last]['close']/entry*(1-half_cost)-1
    benchmark_drawdown = max(benchmark_drawdown, 1-(1+benchmark_return)/benchmark_peak)
    return {'net_return_proxy':equity-1, 'trade_close_drawdown_proxy':drawdown,
            'entries':trades, 'opportunities':opportunities,
            'abstention_fraction':1-trades/opportunities,
            'net_win_fraction':wins/trades if trades else None,
            'round_trip_cost_bps':cost_bps,
            'buy_hold_return_proxy':benchmark_return,
            'buy_hold_close_drawdown_proxy':benchmark_drawdown}


def run(rows, horizon=3, iterations=100, costs=(20,40,80)):
    if horizon < 1 or horizon > 50 or iterations < 1 or iterations > 2000:
        raise ValueError('horizon must be 1..50 and iterations 1..2000')
    if not costs or any(not math.isfinite(c) or c < 0 or c > 1000 for c in costs):
        raise ValueError('Costs must be finite round-trip bps in 0..1000')
    data = research.samples(rows, horizon)
    if len(data) < 180:
        raise ValueError('Insufficient samples for three chronological partitions')
    validation_start, holdout_start = int(len(data)*.6), int(len(data)*.8)
    holdout = data[holdout_start:]
    validation = research.purged_before(data[validation_start:holdout_start], holdout[0]['index'])
    training = research.purged_before(data[:validation_start], validation[0]['index'])
    if not validation or not holdout:
        raise ValueError('Empty evaluation partition')
    model = research.fit(training, iterations=iterations)
    model['training_up_frequency'] = statistics.mean(s['y'] for s in training)
    candidates = {name:(lambda i, name=name:baseline_signal(name, rows, i))
                  for name in ('drift','rebound','breaker')}
    for threshold in (.55,.65):
        candidates['logistic_'+str(threshold)] = lambda i,t=threshold:research.probability(model,research.feature_at(rows,i)) >= t
    validation_results = {name:[score(rows,validation,signal,horizon,c) for c in costs]
                          for name,signal in candidates.items()}
    # Selection uses only validation at the highest declared stress cost.
    stress_index = max(range(len(costs)), key=lambda i:costs[i])
    eligible = [name for name in candidates if validation_results[name][stress_index]['entries'] >= 5]
    selected = max(eligible,key=lambda name:validation_results[name][stress_index]['net_return_proxy']) if eligible else None
    # Only the already-selected candidate consumes final holdout. No refitting
    # or second selection after observing the final report.
    final = [score(rows,holdout,candidates[selected],horizon,c) for c in costs] if selected else None
    return {'state':'research-only','execution_approved':False,'automatic_activation':False,
            'trial_count':len(candidates),'evaluation_scenarios':len(candidates)*len(costs),
            'selection':'Highest validation net return at maximum cost; at least five validation entries',
            'selected_candidate':selected,'validation':validation_results,'final_holdout':final,
            'split':{'train_samples':len(training),'train_last_label_index':training[-1]['label_end'],
                     'validation_first_index':validation[0]['index'], 'validation_last_label_index':validation[-1]['label_end'],
                     'holdout_first_index':holdout[0]['index'],'holdout_samples':len(holdout)},
            'trained_model':model,
            'limitations':['These deterministic research baselines are not the production execution strategies.',
                          'Next-open entry/horizon-close exit proxy excludes intrabar drawdown, depth, funding and latency.',
                          'Trade-close drawdown understates possible intratrade losses.',
                          'Holdout is consumed by this report. Repeated dataset experiments require a new untouched release holdout.',
                          'No profitability promise; no Laya weight training; no broker requests.']}


def write_artifact(path, result):
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open('x', encoding='utf-8') as stream:
        json.dump(result, stream, indent=2, allow_nan=False)
    return research.digest(target)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--csv', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--source', required=True, help='Dataset provenance')
    parser.add_argument('--rights', required=True, help='Retention/training rights basis')
    parser.add_argument('--horizon',type=int,default=3)
    parser.add_argument('--iterations',type=int,default=100)
    parser.add_argument('--costs-bps',type=float,nargs='+',default=[20,40,80])
    args=parser.parse_args()
    if not args.source.strip() or not args.rights.strip():
        parser.error('Non-empty source and rights statements required')
    rows=research.read_candles(args.csv)
    result=run(rows,args.horizon,args.iterations,args.costs_bps)
    result['manifest']={'created_at_utc':datetime.now(timezone.utc).isoformat(),
                        'dataset_sha256':research.digest(args.csv),
                        'tournament_code_sha256':research.digest(__file__),
                        'research_code_sha256':research.digest(research.__file__),
                        'python':platform.python_version(),'source':args.source,'rights':args.rights,
                        'configuration':vars(args),'bars':len(rows),
                        'first_timestamp_ms':rows[0]['timestamp'],'last_timestamp_ms':rows[-1]['timestamp']}
    sha=write_artifact(args.out,result)
    print(json.dumps({'artifact':args.out,'sha256':sha,'state':result['state'],'selected':result['selected_candidate']}))


if __name__ == '__main__':
    main()
