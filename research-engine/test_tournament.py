import math
from pathlib import Path
import tempfile
import unittest
import tournament


def candles(count=600):
    rows=[]
    previous=100.0
    for i in range(count):
        close=previous*math.exp(.002*math.sin(i/7)+.0004)
        rows.append({'timestamp':1600000000000+i*60000,'open':previous,
                     'high':max(previous,close)*1.001,'low':min(previous,close)*.999,
                     'close':close,'volume':100})
        previous=close
    return rows


class TournamentTests(unittest.TestCase):
    def test_signals_read_prefix_only(self):
        rows=candles()
        for name in ('drift','rebound','breaker'):
            self.assertEqual(tournament.baseline_signal(name,rows,50),tournament.baseline_signal(name,rows[:51],50))

    def test_purged_boundaries_and_holdout_does_not_select(self):
        rows=candles()
        result=tournament.run(rows,iterations=10)
        split=result['split']
        self.assertLess(split['train_last_label_index'],split['validation_first_index'])
        self.assertLess(split['validation_last_label_index'],split['holdout_first_index'])
        for row in rows[split['holdout_first_index']:]:
            row['close']*=10
        changed=tournament.run(rows,iterations=10)
        self.assertEqual(result['selected_candidate'],changed['selected_candidate'])
        self.assertEqual(result['validation'],changed['validation'])
        self.assertEqual(result['trained_model'],changed['trained_model'])
        self.assertEqual(result['trial_count'],5)
        self.assertFalse(result['automatic_activation'])

    def test_cost_stress_and_abstention(self):
        rows=candles()
        samples=tournament.research.samples(rows,3)[50:150]
        low=tournament.score(rows,samples,lambda i:True,3,20)
        high=tournament.score(rows,samples,lambda i:True,3,80)
        idle=tournament.score(rows,samples,lambda i:False,3,20)
        self.assertGreater(low['net_return_proxy'],high['net_return_proxy'])
        self.assertEqual(idle['abstention_fraction'],1)
        self.assertEqual(idle['net_return_proxy'],0)
        self.assertLessEqual(low['entries'],34)

    def test_exclusive_manifest_creation(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'report.json'
            self.assertEqual(len(tournament.write_artifact(path,{'state':'test'})),64)
            with self.assertRaises(FileExistsError):
                tournament.write_artifact(path,{'state':'overwrite'})

    def test_reject_invalid_configuration(self):
        for kwargs in ({'horizon':0},{'costs':[float('nan')]},{'costs':[-1]},{'iterations':0}):
            with self.assertRaises(ValueError):
                tournament.run(candles(),**kwargs)


if __name__ == '__main__':
    unittest.main()
