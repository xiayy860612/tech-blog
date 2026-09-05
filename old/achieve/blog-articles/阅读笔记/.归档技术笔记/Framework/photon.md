# Real-Time Server Framework - Photon

Photon可用于构建实时性的游戏服务器。
可用于构建Load Balance或者MMO Server。

Official Site: https://www.photonengine.com/en-US/
<!-- more -->

## Basic Knowledge

### ApplicationBase
It used to set up an server application 
and create connection peers.

Importance Interface:
- PeerBase CreatePeer(InitRequest initRequest), 
when a new connection comes, this function will be raised.
- void Setup()
- void TearDown()

### Connect Peer
It represents a connection with server application.
Process all communications and status updates in peer.

Each kind of peer should inherit from **PeerBase**.
There are some different kind of Peers:
- ClientPeer, Client-Server Peer
    + Peer
- S2SPeerBase, Server-Server Peer
    + InboundS2SPeer
    + OutboundS2SPeer

### PeerBase::OnDisconnect
When connected peer is disconnect, this function will be raised.

### PeerBase::OnOperationRequest
Process Operation from connected peer.

Operations mostly are from Client to Server.
Also game server to master server.

Developers should define uniform **OperationCode** for each Operation.

### S2SPeerBase::OnEvent
When server peer in master server received events from game server, 
this function will be raised.

### Peer::SetCurrentOperationHandler
Set an operation handler to process operations from client peer.

Developers should implement the interface of **IOperationHandler**.

### PoolFiber
Use it to execute some actions in async way.

### LogManager
Use it to track log.

It's implements based on [log4net](https://logging.apache.org/log4net/).

### Configuration Manager
Use **ApplicationSettingsBase** to serialize configuration file 
with "applicationSettings" tag.

### Exception Handler

### Channel
It separates messages from client peer into multiple channels, 
each being sequenced independently. 

### Custom Authentication
Developers could use its own authentication server 
and integrated into Photon Server.

### Web Service Integration with Photon Server

Developers could use Webhooks and WebRPC to extend Photon Server.

#### Webhooks
It used to process individual tasks called automatically 
by Photon Server where needed.

It could only be used by Photon Server.

#### WebRPC
It used to integrate external services with Photon server. 
Client can ask Photon server to fetch data 
from an external web service by WebRPC.

It could be used by Photon Server and Clients.

#### Serialization
Photon provides a way to serialize/deserialize message data into binary.

## Loadbalancing

### Master Server

Requirements
- Maintains connected servers and monitor their status
- Maintains Lobby List
- As a load balancer, get available game for client
- Create auth token for connected clients

#### LoadBalancer
Monitor server state and Use it to get an available server to set up games.

#### GameApplication
It maintains all games and take charge of creating game.

#### AppLobby
It maintains the games assigned to this lobby.

#### GameState
It represents a game and and contains the game server info 
which used to set up the game.

It also maintains the connected clients in it.

#### CustomAuthHandler
It used to authorize connected clien if it's available.

### Game Server







