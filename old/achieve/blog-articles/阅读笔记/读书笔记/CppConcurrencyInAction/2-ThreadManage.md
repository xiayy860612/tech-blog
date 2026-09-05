# 线程管理

std::thread 需要引用头文件 `<thread>`.

RAII(Resource Acquisition Is Initialization), 资源获取初始化方式. 来保证线程在函数结束之前结束.

```
// RAII Example
class thread_guard
{
    std::thread& t;
public:
    explicit thread_guard(std::thread& t_)
        :t(t_)
    {}
    
    ~thread_guard()
    {
        if(t.joinable())
        {
            t.join(); // 在析构时,保证线程执行完毕
        }
    }
    
    // 禁掉拷贝构造和赋值操作
    thread_guard(thread_guard const&) = delete;
    thread_guard& operator=(thread_guard const&) = delete;
};
```


std::thread的构造函数无视执行函数期待的参数类型, 而盲目拷贝已提供的变量,
传入的变量将被拷贝到线程内存中.

使用std::move将对象的所有权进行转移,由另一个实例持有.

std::thread实例时可移动且不可拷贝的, 同一时间, 只能关联一个执行线程.

线程可通过std::thread::id来进行识别.