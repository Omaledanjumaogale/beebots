import argparse
import contextlib
import csv
import io
import json
import math
import tempfile
import unittest
from pathlib import Path
import research


def candles(count=500):
    rows=[]
    previous=100.0
    for i in range(count):
        close=previous*math.exp(.001*math.sin(i/7)+.0003)
        rows.append({'timestamp':1_600_000_000_000+i*60_000,'open':previous,'high':max(previous,close)*1.001,'low':min(previous,close)*.999,'close':close,'volume':100+i%5})
        previous=close
    return rows


class ResearchTests(unittest.TestCase):
    def test_feature_prefix_invariance(self):
        rows=candles()
        expected=research.feature_at(rows,40)
        self.assertEqual(expected,research.feature_at(rows[:41],40))
        for row in rows[41:]:
            row['close']=1_000_000
        self.assertEqual(expected,research.feature_at(rows,40))

    def test_purge_excludes_overlapping_labels(self):
        data=research.samples(candles(),7)
        validation=data[200:220]
        training=research.purged_before(data[:200],validation[0]['index'])
        self.assertTrue(all(row['label_end']<validation[0]['index'] for row in training))
        self.assertEqual(len(training),193)

    def test_normalization_and_fitting_never_reads_holdout(self):
        data=research.samples(candles(),3)
        training=research.purged_before(data[:200],data[200]['index'])
        model=research.fit(training,40)
        for row in data[200:]:
            row['x']=[1e9]*4
            row['y']=1-row['y']
        self.assertEqual(model,research.fit(training,40))
        self.assertAlmostEqual(model['mean'][0],sum(row['x'][0] for row in training)/len(training))

    def test_gradient_learns_controlled_signal(self):
        data=[{'x':[(-1 if i%2 else 1),0,0,0],'y':int(i%2==0),'label_end':i+1} for i in range(200)]
        model=research.fit(data,200)
        self.assertGreater(research.probability(model,[1,0,0,0]),.9)
        self.assertLess(research.probability(model,[-1,0,0,0]),.1)

    def test_targets_use_next_bar_open(self):
        rows=candles()
        row=research.samples(rows,3)[0]
        self.assertAlmostEqual(row['return'],rows[23]['close']/rows[21]['open']-1)

    def test_costs_abstention_and_nonoverlap(self):
        model={'mean':[0]*4,'scale':[1]*4,'weights':[0]*5,'training_up_frequency':.5}
        data=[{'index':i,'x':[0]*4,'y':1,'return':.001} for i in range(12)]
        result=research.evaluate(model,data,3,20,.6)
        self.assertEqual(result['long_entries'],0)
        self.assertEqual(result['abstention_fraction'],1)
        model['weights'][0]=10
        result=research.evaluate(model,data,3,20,.6)
        self.assertEqual(result['long_entries'],4)
        self.assertLess(result['paper_return_proxy'],0)

    def test_cli_artifact_provenance_and_exclusive_output(self):
        with tempfile.TemporaryDirectory() as folder:
            dataset=Path(folder)/'candles.csv'
            with dataset.open('w',newline='') as stream:
                writer=csv.DictWriter(stream,fieldnames=['timestamp','open','high','low','close','volume']);writer.writeheader();writer.writerows(candles())
            args=argparse.Namespace(csv=str(dataset),out=str(Path(folder)/'model.json'),source='synthetic test fixture',rights='test fixture only',horizon=3,iterations=20,learning_rate=.08,regularization=.01,cost_bps=20,threshold=.6)
            with contextlib.redirect_stdout(io.StringIO()):
                research.train(args)
            artifact=json.loads(Path(args.out).read_text())
            self.assertTrue(artifact['trained']);self.assertFalse(artifact['approved'])
            self.assertEqual(artifact['state'],'shadow-only')
            self.assertEqual(artifact['manifest']['dataset_sha256'],research.digest(dataset))
            self.assertLess(artifact['model']['training_last_label_index'],artifact['holdout']['start_index'])
            with self.assertRaises(FileExistsError),contextlib.redirect_stdout(io.StringIO()):
                research.train(args)
            # Data gap must not silently enter training.
            lines=dataset.read_text().splitlines();dataset.write_text('\n'.join(lines[:50]+lines[51:]))
            with self.assertRaisesRegex(ValueError,'Missing or irregular'):
                research.read_candles(dataset)


if __name__=='__main__':
    unittest.main()
