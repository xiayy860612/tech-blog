# Docker --- MySQL

docker run --name local-mysql -v /home/xiayy860612/docker_data/mysql/data:/var/lib/mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=test123 -d mysql:5.7