<#
.SYNOPSIS
  Reports whether the site is actually deployed.

.DESCRIPTION
  Read-only. Checks sign-in, remote, repo, Pages config, the last workflow
  run, DNS, and whether the URLs actually respond. Changes nothing.

.EXAMPLE
  .\scripts\verify.cmd
#>
[CmdletBinding()]
param([string]$Domain = 'aakashxyz.com')

$GhPagesIPv4 = @('185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153')

function Write-Pass { param([string]$T) Write-Host "  [ok]      $T" -ForegroundColor Green }
function Write-Wait { param([string]$T) Write-Host "  [pending] $T" -ForegroundColor Yellow }
function Write-Fail { param([string]$T) Write-Host "  [no]      $T" -ForegroundColor Red }

function Resolve-Gh {
  $cmd = Get-Command gh -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @(
      (Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe'),
      (Join-Path ${env:ProgramFiles(x86)} 'GitHub CLI\gh.exe'),
      (Join-Path $env:LOCALAPPDATA 'Programs\GitHub CLI\gh.exe'))) {
    if ($p -and (Test-Path $p)) { return $p }
  }
  return $null
}

function Invoke-Gh {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GhArgs)
  $out = & $script:gh @GhArgs 2>&1
  $script:GhExit = $LASTEXITCODE
  return ($out | Out-String).Trim()
}

function Get-UrlStatus {
  param([string]$Url)
  try {
    $r = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 15 -MaximumRedirection 5 -ErrorAction Stop
    return [int]$r.StatusCode
  }
  catch {
    if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
    return 0
  }
}

Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "`nDeployment status for $Domain" -ForegroundColor Cyan
Write-Host ('-' * 46)

# 1. CLI + sign-in
$script:gh = Resolve-Gh
if (-not $script:gh) {
  Write-Fail 'GitHub CLI not installed  ->  winget install --id GitHub.cli'
  return
}
Write-Pass 'GitHub CLI installed'

$null = Invoke-Gh auth status
if ($script:GhExit -ne 0) {
  Write-Fail 'not signed in to GitHub'
  Write-Host "`n  Nothing has been deployed yet. Run:  .\scripts\setup.cmd`n" -ForegroundColor Yellow
  return
}
$login = Invoke-Gh api user --jq .login
Write-Pass "signed in as $login"

# 2. remote
$remoteUrl = (git remote get-url origin 2>$null)
if (-not $remoteUrl) {
  Write-Fail 'no git remote  ->  repo was never created/pushed'
  Write-Host "`n  Run:  .\scripts\setup.cmd`n" -ForegroundColor Yellow
  return
}
Write-Pass "remote: $($remoteUrl.Trim())"

$slug = Invoke-Gh repo view --json nameWithOwner --jq .nameWithOwner
if ($script:GhExit -ne 0 -or -not $slug) { Write-Fail 'repo not reachable on GitHub'; return }
Write-Pass "repo: $slug"

# 3. unpushed work
$ahead = (git rev-list --count '@{u}..HEAD' 2>$null)
if ($LASTEXITCODE -eq 0 -and $ahead -and [int]$ahead -gt 0) { Write-Wait "$ahead local commit(s) not pushed  ->  git push" }
elseif ($LASTEXITCODE -eq 0) { Write-Pass 'all local commits pushed' }

# 4. Pages config
$pages = Invoke-Gh api "repos/$slug/pages"
if ($script:GhExit -ne 0) {
  Write-Fail 'GitHub Pages not enabled'
}
else {
  $p = $pages | ConvertFrom-Json
  Write-Pass "Pages enabled (source: $($p.build_type))"
  if ($p.cname) { Write-Pass "custom domain attached: $($p.cname)" }
  else { Write-Wait 'custom domain not attached yet (expected until DNS points at GitHub)' }
  if ($p.https_enforced) { Write-Pass 'HTTPS enforced' } else { Write-Wait 'HTTPS not enforced yet' }
}

# 5. last workflow run
$json = Invoke-Gh run list --repo $slug --limit 1 --json status,conclusion,url
if ($script:GhExit -eq 0 -and $json -and $json.Trim() -ne '[]') {
  $run = ($json | ConvertFrom-Json)[0]
  if ($run.status -ne 'completed') { Write-Wait "deploy in progress ($($run.status)) - $($run.url)" }
  elseif ($run.conclusion -eq 'success') { Write-Pass 'last deploy succeeded' }
  else { Write-Fail "last deploy $($run.conclusion) - $($run.url)" }
}
else { Write-Wait 'no workflow run yet' }

# 6. is the github.io URL actually serving?
$ghUrl = "https://$login.github.io"
$code = Get-UrlStatus $ghUrl
if ($code -eq 200) { Write-Pass "$ghUrl responds 200" }
elseif ($code -eq 0) { Write-Wait "$ghUrl not responding yet (first deploy can take a few minutes)" }
else { Write-Wait "$ghUrl responds $code" }

# 7. DNS
try {
  $ips = @(Resolve-DnsName -Name $Domain -Type A -DnsOnly -ErrorAction Stop |
    Where-Object { $_.IPAddress } | ForEach-Object { $_.IPAddress })
}
catch { $ips = @() }

if (@($ips | Where-Object { $GhPagesIPv4 -contains $_ }).Count -ge 1) {
  Write-Pass "$Domain points at GitHub Pages"
  $code = Get-UrlStatus "https://$Domain"
  if ($code -eq 200) { Write-Pass "https://$Domain responds 200" }
  else { Write-Wait "https://$Domain responds $code (certificate may still be issuing)" }
}
elseif ($ips.Count) {
  Write-Wait "$Domain still resolves to $($ips -join ', ') - add the GitHub A records at Wix"
}
else {
  Write-Wait "$Domain does not resolve yet"
}

Write-Host ''
