# Event && Delegate

Events in the .NET Framework are based on the delegate model.
The delegate model follows the observer design pattern,
which enables a subscriber to register with, and receive notifications from, a provider.
<!--more-->

Event-Delegate Pattern:
- [Event][Events]
- Delegate for Event Handler
- Event Data

The .NET Framework provides **EventHandler** and **EventHandler<TEventArgs>** delegates to support most event scenarios.

The **EventArgs** class is the base type for all event data classes.

---
[Events]: https://msdn.microsoft.com/en-us/library/awbftdfh(v=vs.110).aspx
