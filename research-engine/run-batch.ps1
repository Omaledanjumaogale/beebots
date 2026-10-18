param(
  [Parameter(Mandatory=$true)][string]$DataRights,
  [string]$PythonCommand = 'python'
)
$ErrorActionPreference = 'Stop'
$workerRoot = $PSScriptRoot
$lockPath = Join-Path $workerRoot '.batch-lock'
# Directory creation is atomic; an existing lock blocks overlapping batches.
if (Test-Path -LiteralPath $lockPath) { throw 'Research batch lock exists; inspect the previous worker before recovery.' }
New-Item -ItemType Directory -Path $lockPath -ErrorAction Stop | Out-Null
try {
  $batchStamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ')
  $datasetPath = Join-Path $workerRoot "datasets/btc-$batchStamp.csv"
  $artifactPath = Join-Path $workerRoot "experiments/btc-$batchStamp.json"
  & $PythonCommand (Join-Path $workerRoot 'research.py') fetch --symbol BTC-USDT --bar 5m --pages 20 --out $datasetPath
  if ($LASTEXITCODE -ne 0) { throw 'Market dataset fetch failed' }
  & $PythonCommand (Join-Path $workerRoot 'research.py') train --csv $datasetPath --source 'OKX BTC-USDT public 5m confirmed closed candles' --rights $DataRights --out $artifactPath
  if ($LASTEXITCODE -ne 0) { throw 'Research training failed' }
} finally {
  # Only remove the exact lock directory created by this worker; never recursive.
  Remove-Item -LiteralPath $lockPath -ErrorAction Stop
}
