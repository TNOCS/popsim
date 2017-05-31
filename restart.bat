@echo off
set arg1=%1
shift

REM http://stackoverflow.com/questions/26551/how-do-i-pass-command-line-parameters-to-a/Batch-file
REM echo off
REM set arg1=%1
REM set arg2=%2
REM shift
REM shift
REM fake-command /u %arg1% /p %arg2% %*

start /B pm2 stop all
start /B pm2 flush

cd kafka
docker-compose stop
docker-compose rm -f -v
cd ..
REM PUT %arg% between "" in case it is not defined.
IF "%arg1%"=="dev" (
  cd bag
  echo INSTALLING AND COMPILING
  yarn install
  tsc
  cd ../cbs
  yarn install
  tsc
  cd ../pop
  yarn install
  tsc
  cd ../gui
  yarn install
  tsc
  cd ..
) ELSE (
  @echo TIP: Use the optional dev parameter to compile everything.
)
cd kafka
docker-compose up -d
cd ..
pm2 start all
