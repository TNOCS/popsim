start /B pm2 stop all

cd kafka
docker-compose stop
docker-compose rm -f -v
cd ..

