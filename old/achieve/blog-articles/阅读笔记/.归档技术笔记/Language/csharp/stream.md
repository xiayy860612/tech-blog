# Stream

C#中的[Stream处理机制][File and Stream I/O]

**System.IO** namespace contains types related to stream read/write.
<!--more-->

## Stream
The abstract base class [Stream][Steam Class] supports reading and writing **byte[]**.

Stream is the abstract base class of all streams.
A stream is an abstraction of a sequence of bytes, such as
- file
- input/output device
- inter-process communication pipe
- TCP/IP socket.

The Stream class and its derived classes provide a generic view
of these different types of input and output,
and isolate the programmer from the specific details
of the operating system and the underlying devices.

## Readers and Writers
The reader and writer types handle the **conversion of the encoded characters**
to and from bytes so the stream can complete the operation.
Each reader and writer class is associated with a stream by **BaseStream** property.

---
[File and Stream I/O]: https://msdn.microsoft.com/en-US/library/k3352a4t.aspx
[Steam Class]: https://msdn.microsoft.com/en-us/library/system.io.stream.aspx
