set -eu
printf 'FOYER_HOME_INSPECT_BEGIN\n'
/usr/bin/dotnet /home/owner/share/tmp/sdk_tools/FoyerHomeControl.dll query
printf 'FOYER_HOME_INSPECT_END\n'
