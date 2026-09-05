# Dispose Pattern

Developers must be careful when using such system resources, 
because they must be released after they have been acquired and used.

So we need use [Dispose Pattern](https://msdn.microsoft.com/en-us/library/b1yfkh5e.aspx) 
to help release these resources.

<!--more-->

Garbage collector (GC) will release Managed memory (memory allocated using the C# operator new) automatically.

Resources other than managed memory are referred to unmanaged resources, they should be released by manual.

2 ways to reclaim unmanaged resources
- override virutal method **Finalize**
- Implement **IDisposable** for Dispose Pattern

## Finalize

Drawback
- It's called by GC in undeterminde time, developers can't be sure when unmanaged resources are released.
- After Finalize is called by GC, the memory of unmanaged resources' objects won't released at once, 
it will be delayed to next collection.

Finalize is not comfortable for reclaim unmanaged resources asap.

## IDisposable

It provides a manual way to release unmanaged resources as soon as they are not needed.

It provides **GC.SuppressFinalize** method that tell GC that an object was manually disposed of 
and does not need to be finalized anymore, in that case object’s memory can be reclaimed earlier.

The objects are **finalized in an unpredictable order** and so they, 
or any of their dependencies, might already have been finalized.

Important Rules: 
- (**DO**) Implement [Basic Dispose Pattern](https://msdn.microsoft.com/en-us/library/b1yfkh5e.aspx#basic_pattern) 
on types containing **instances of disposable types**.
- (**DO**) Implement [Basic Dispose Pattern](https://msdn.microsoft.com/en-us/library/b1yfkh5e.aspx#basic_pattern) 
and override **Finalize** on types holding resources that need to be freed explicitly and that do not have finalizers.
- (**CONSIDER**) Implementing [Basic Dispose Pattern](https://msdn.microsoft.com/en-us/library/b1yfkh5e.aspx#basic_pattern) on classes 
that not hold unmanaged resources or disposable objects but are likely to have subtypes that do.
- (**CONSIDER**) Providing method Close() and invoked in Dispose(), if close is standard terminology in the area.
- (**DO**) Not raise exception in Dispose. 
If Dispose could raise an exception, further finally-block cleanup logic will not execute.
- (**DO**) If base class already is finalizable and implements Basic Dispose Pattern, 
you should not override Finalize again. 
- (**DO**) using resource wrappers such as **SafeHandle** to encapsulate unmanaged resources where possible, 
in which case a finalizer becomes unnecessary because the wrapper is responsible for its own resource cleanup.
coz there is a real cost associated with instances with finalizers, from both a performance and code complexity standpoint.
- (**DO**) Make a type finalizable if the type is responsible for releasing an unmanaged resource that does not have its own finalizer.
- (**DO**) Make your Finalize method protected.

### Basic Dispose Pattern

    public class DisposableResourceHolder : IDisposable {  
        private SafeHandle resource; // handle to a resource  
    
        public DisposableResourceHolder(){  
            this.resource = ... // allocates the resource  
        }  
    
        // Impl IDisposable Below parts
        public void Dispose(){  
            Dispose(true);  
            GC.SuppressFinalize(this);  
        }  

        // finalizer
        ~ DisposableResourceHolder()
        {
            Dispose(false);  
        }
    
        // allow the Dispose(bool) method to be called more than once. 
        // The method might choose to do nothing after the first call.
        bool disposed = false; 

        protected virtual void Dispose(bool disposing){  
            if(disposed) return;
            if (disposing){  
                // Unmanaged resources
                if (resource!= null) resource.Dispose();  
            }  
            // managed resources
            ...

            disposed = true; 
        }
    }  

Parameter **disposing** of IDisposable.Dispose method is true when invoked by Dispose, false by Finalize.