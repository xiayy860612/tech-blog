# ELK-Filebeat

Filebeat is a log data shipper.
Installed as an agent on your servers,
Filebeat monitors the log directories or specific log files,
tails the files, and forwards them either to Elasticsearch or Logstash for indexing.

![Filebeat](filebeat.png)

<!--more-->

## Directory Layout

|Type|Description|Default Location|Config Option|
|:---|:---|:---|:---|
|home|Home of the Filebeat installation.|NULL|path.home|
|bin|The location for the binary files.|{path.home}|NULL|
|conf|The location for configuration files.|{path.home}|path.conf|
|data|he location for persistent data files.|{path.home}/data|path.data|
|logs|The location for the logs created by Filebeat.|{path.home}/logs|path.logs|

## prospectors && harvesters

- harvester, it's responsible for reading the content of a single file.
The harvester reads each file, line by line, and sends the content to the output.
**One harvester is started for one file**.
- prospector, it's responsible for managing the harvesters
and finding all sources to read from.

If a file is removed or renamed while it’s being harvested,
Filebeat continues to read the file.
The file space on disk is reserved until the harvester closes.
