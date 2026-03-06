$envFile = Get-Content ".env.local"
foreach ($line in $envFile) {
    if ($line -match '^([^#][^=]+)=(.*)$') {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}
node scripts/post-threads.mjs $args
