# Configuration

Configuration Managemnet Implement in C#.
<!--more-->

## Configuration Management Features

- Manage different kind of multiple configuration sources.
- Easy to config for different environments, such as dev, release.
- Bind configuration values into Decoupled Configuration Class.
- Reload Configurations when configuration updates.

## Example

    // player.json
    {
        "Player": {
            "Name": "HH",
            "Age": 10
        }
    }

    // Source
    public class Player
    {
        public string Name { get; set; }
        public int Age { get; set; }
    }
    static void Main(string[] args)
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("player.json");

        var conf = builder.Build();
        
        var player = conf.GetSection("Player").Get<Player>();
        Console.WriteLine($"{player.Name}: {player.Age}");
    }


## Configuration Management in ASP.Net Core
Essential packages

- Microsoft.Extensions.Configuration.Abstractions, 
define essential interfaces for configuration management.
- Microsoft.Extensions.Configuration, basic implement of interfaces 
in Microsoft.Extensions.Configuration.Abstractions
- Microsoft.Extensions.Configuration.Binder, 
use reflect to convert configurations into decoupled configuration class.

![ASP.Net Configuration Design](asp.net-conf.png)

**IConfiguration**

Provides friendly common interfaces for users to get configuration.

It manages multiple configuration providers.

**IConfigurationProvider**

It contains configuration data in memory which loaded from configuration source.

Store configuration data as key-value in dictionary, key should be path splited by ":" by default.

    // A example of one configuration dat stored
    { "Data:Player:Name", "Hello" }


**IConfigurationSource**

It's a representation of configuration source 
and used to build provider.

Also it used to watch update of source, 
when update notify provider to reload data from source.

**Configuration Class Bind**

It should always get a copy of data 
from configuration provider for configuration class.
It makes thead-safe.

## Reference
- [Interface Segregation Principle](http://deviq.com/interface-segregation-principle/)
- [Separation of Concerns](http://deviq.com/separation-of-concerns/)
- [Builder pattern](https://en.wikipedia.org/wiki/Builder_pattern)

---
[Configuration in ASP.Net Core]: https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration

