<#
.SYNOPSIS
  One-shot GitHub setup for aakashxyz.com.

.DESCRIPTION
  Creates the GitHub repo, pushes this project, turns on Pages with the
  GitHub Actions source, and waits for the first deploy. The site is then
  live at https://<you>.github.io straight away.

  The custom domain is attached ONLY after DNS actually points at GitHub.
  That ordering matters: a user Pages site (<you>.github.io) 301-redirects to
  its custom domain as soon as one is set, so setting the domain while DNS
  still points somewhere else takes the whole site offline.

  The one thing this cannot do is add the DNS records - those live at your
  registrar. The script prints exactly what to enter, waits for them to
  resolve, then attaches the domain and turns on HTTPS.

  Safe to re-run. Run it once now to go live, and again after DNS is set.

.EXAMPLE
  .\scripts\setup-pages.ps1

.EXAMPLE
  .\scripts\setup-pages.ps1 -RepoName aakashxyz -Private
#>
[CmdletBinding()]
param(
  [string]$Domain = 'aakashxyz.com',
  [string]$RepoName,
  [switch]$Private,
  [switch]$SkipDnsWait
)

$ErrorActionPreference = 'Stop'

$GhPagesIPv4 = @('185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153')
$GhPagesIPv6 = @('2606:50c0:8000::153', '2606:50c0:8001::153', '2606:50c0:8002::153', '2606:50c0:8003::153')

function Write-Step { param([string]$Text) Write-Host "`n==> $Text" -ForegroundColor Cyan }
function Write-Ok { param([string]$Text) Write-Host "    ok  $Text" -ForegroundColor Green }
function Write-Note { param([string]$Text) Write-Host "    !   $Text" -ForegroundColor Yellow }

function Resolve-Gh {
  $cmd = Get-Command gh -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $candidates = @(
    (Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'GitHub CLI\gh.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\GitHub CLI\gh.exe')
  )
  foreach ($p in $candidates) { if ($p -and (Test-Path $p)) { return $p } }
  throw 'GitHub CLI not found. Install it with:  winget install --id GitHub.cli'
}

function Invoke-Gh {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GhArgs)
  $out = & $script:gh @GhArgs 2>&1
  $script:GhExit = $LASTEXITCODE
  return ($out | Out-String).Trim()
}

# --- 0. prerequisites -------------------------------------------------------
$script:gh = Resolve-Gh
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Step "Using $($script:gh)"
Write-Ok "project: $repoRoot"

if (-not (Test-Path (Join-Path $repoRoot '.git'))) {
  throw "No git repository here. Run 'git init' first."
}

# --- 1. authentication ------------------------------------------------------
Write-Step 'Checking GitHub authentication'
$null = Invoke-Gh auth status
if ($script:GhExit -ne 0) {
  Write-Note 'Not signed in. Opening a browser login (no password is ever typed here).'
  & $script:gh auth login --hostname github.com --git-protocol https --web --scopes 'repo,workflow'
  if ($LASTEXITCODE -ne 0) { throw 'Sign-in did not complete. Re-run this script once you are signed in.' }
}

$login = Invoke-Gh api user --jq .login
if ($script:GhExit -ne 0 -or -not $login) { throw "Could not read your GitHub account: $login" }
Write-Ok "signed in as $login"

if (-not $RepoName) { $RepoName = "$login.github.io" }
$slug = "$login/$RepoName"

# --- 2. git identity --------------------------------------------------------
if (-not (git config user.email)) {
  $email = Invoke-Gh api user --jq '.email // empty'
  if ($script:GhExit -ne 0 -or -not $email) { $email = "$login@users.noreply.github.com" }
  git config user.name $login
  git config user.email $email
  Write-Ok "git identity set to $login <$email>"
}

# --- 3. repository ----------------------------------------------------------
Write-Step "Preparing repository $slug"
$null = Invoke-Gh repo view $slug --json name
$repoExists = ($script:GhExit -eq 0)

if (-not $repoExists) {
  $visibility = if ($Private) { '--private' } else { '--public' }
  $out = Invoke-Gh repo create $RepoName $visibility --description "Personal site - $Domain" --source=. --remote=origin --push
  if ($script:GhExit -ne 0) { throw "Could not create the repository:`n$out" }
  Write-Ok "created and pushed $slug"
}
else {
  Write-Note "$slug already exists - pushing to it instead of creating."
  $remotes = @(git remote 2>$null)
  if ($remotes -notcontains 'origin') { git remote add origin "https://github.com/$slug.git" }
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  git push -u origin $branch
  if ($LASTEXITCODE -ne 0) { throw 'Push failed. Resolve the problem above, then re-run.' }
  Write-Ok "pushed to $slug"
}

# --- 4. Pages: source = GitHub Actions --------------------------------------
Write-Step 'Enabling GitHub Pages (source: GitHub Actions)'
$out = Invoke-Gh api -X POST "repos/$slug/pages" -f build_type=workflow
if ($script:GhExit -ne 0) {
  $out = Invoke-Gh api -X PUT "repos/$slug/pages" -f build_type=workflow
  if ($script:GhExit -ne 0) { throw "Could not enable Pages:`n$out" }
}
Write-Ok 'Pages source set to GitHub Actions'

# --- 5. first deploy --------------------------------------------------------
Write-Step 'Waiting for the first deploy'
$run = $null
$state = ''
$deadline = (Get-Date).AddMinutes(8)
do {
  Start-Sleep -Seconds 10
  $json = Invoke-Gh run list --repo $slug --limit 1 --json 'status,conclusion,url'
  if ($script:GhExit -eq 0 -and $json -and $json.Trim() -ne '[]') {
    $run = ($json | ConvertFrom-Json)[0]
    $state = $run.status
    Write-Host "    $($run.status) $($run.conclusion)" -ForegroundColor DarkGray
  }
} while ($state -ne 'completed' -and (Get-Date) -lt $deadline)

if ($state -eq 'completed' -and $run) {
  if ($run.conclusion -eq 'success') { Write-Ok "deploy succeeded - $($run.url)" }
  else { Write-Note "deploy finished with '$($run.conclusion)': $($run.url)" }
}
else {
  Write-Note "Deploy still running. Watch it with:  gh run watch --repo $slug"
}

$isUserPage = ($RepoName -eq "$login.github.io")
$liveUrl = if ($isUserPage) { "https://$login.github.io" } else { "https://$login.github.io/$RepoName/" }
$deployed = ($state -eq 'completed' -and $run -and $run.conclusion -eq 'success')
Write-Host ''
if ($deployed) { Write-Ok "your site is live at $liveUrl" }
else { Write-Note "once the deploy finishes your site will be at $liveUrl" }
if (-not $isUserPage) {
  Write-Note "This is a project page served from a subfolder. vite.config.ts uses base '/',"
  Write-Note "so assets will 404 until the custom domain is attached."
}

# --- 6. DNS -----------------------------------------------------------------
Write-Step "DNS records to set at your registrar for $Domain"
Write-Host ''
Write-Host '    Type   Name   Value' -ForegroundColor White
Write-Host '    ----   ----   -----' -ForegroundColor DarkGray
foreach ($ip in $GhPagesIPv4) { Write-Host "    A      @      $ip" }
foreach ($ip in $GhPagesIPv6) { Write-Host "    AAAA   @      $ip" }
Write-Host "    CNAME  www    $login.github.io"
Write-Host ''
Write-Note 'Delete the existing parking A records first (Wix parks on 185.230.63.x).'
Write-Note 'On Wix the "www" host is reserved, so that CNAME may be rejected -'
Write-Note 'the apex A records alone are enough for the site to work.'
Write-Host ''

if ($SkipDnsWait) {
  Write-Note 'Skipping the DNS check (-SkipDnsWait). Re-run later to attach the domain.'
  Write-Host "`nDone for now.  $liveUrl`n" -ForegroundColor Green
  return
}

Write-Host '    Waiting for these to resolve (Ctrl+C to stop; re-run anytime).' -ForegroundColor DarkGray
$dnsOk = $false
$deadline = (Get-Date).AddMinutes(20)
do {
  $answers = @()
  try {
    $answers = @(Resolve-DnsName -Name $Domain -Type A -DnsOnly -ErrorAction Stop |
      Where-Object { $_.IPAddress } | ForEach-Object { $_.IPAddress })
  }
  catch { $answers = @() }

  if (@($answers | Where-Object { $GhPagesIPv4 -contains $_ }).Count -ge 1) { $dnsOk = $true; break }

  $shown = if ($answers.Count) { $answers -join ', ' } else { 'unresolved' }
  Write-Host "    still $shown" -ForegroundColor DarkGray
  Start-Sleep -Seconds 30
} while ((Get-Date) -lt $deadline)

if (-not $dnsOk) {
  Write-Note 'DNS has not propagated yet, so the custom domain was NOT attached.'
  Write-Note "That is deliberate - attaching it now would redirect $liveUrl to a"
  Write-Note 'domain that does not point here yet, taking the site offline.'
  Write-Note 'Add the records above, then just re-run this script.'
  Write-Host "`nStill live at $liveUrl`n" -ForegroundColor Green
  return
}
Write-Ok "$Domain resolves to GitHub Pages"

# --- 7. attach the custom domain --------------------------------------------
Write-Step "Attaching custom domain $Domain"
$out = Invoke-Gh api -X PUT "repos/$slug/pages" -f "cname=$Domain"
if ($script:GhExit -ne 0) { throw "Could not set the custom domain:`n$out" }
Write-Ok "custom domain: $Domain"

# --- 8. HTTPS ---------------------------------------------------------------
Write-Step 'Enabling HTTPS enforcement (waits for the certificate)'
$httpsOk = $false
$deadline = (Get-Date).AddMinutes(20)
do {
  $null = Invoke-Gh api -X PUT "repos/$slug/pages" -F https_enforced=true
  if ($script:GhExit -eq 0) { $httpsOk = $true; break }
  Write-Host '    certificate not issued yet...' -ForegroundColor DarkGray
  Start-Sleep -Seconds 30
} while ((Get-Date) -lt $deadline)

if ($httpsOk) { Write-Ok 'HTTPS enforced' }
else { Write-Note 'Certificate still provisioning. Re-run later, or tick "Enforce HTTPS" in Settings > Pages.' }

Write-Host "`nDone.  https://$Domain`n" -ForegroundColor Green
