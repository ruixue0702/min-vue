// 构造函数 传入构造参数
// new RXVue({
//     data: {
//         msg: 'hello'
//     }
// })
class RXVue {
    // 构造参数 options
    constructor(options){
        this.$options = options
        this.$data = options.data
        // 响应化
        this.observe(this.$data)

        // 测试代码
        // new Watcher(this, 'test')
        // this.test;
        
        // 创建编译器
        new Compile(options.el, this)
        if (options.created) {
            //  fn1.call(fn2) 使得 fn1对象的this指向了fn2
            options.created.call(this)
        }
    }
    // 递归遍历 使传递进来的对象响应化
    observe(value) {
        if (!value || typeof value !== 'object'){
            return
        }
        // 遍历
        // 如果 value 是 object ; 向深一层次遍历
        Object.keys(value).forEach(key => {
            // 对 key 做响应式处理
            this.defineReactive(value, key, value[key])
            this.proxyData(key)
        })
    }
    // 在 vue 根上定义属性代理 data 中的数据
    // this = el 可以从实例上直接获取数据
    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key]
            },
            set(newVal) {
                this.$data[key] = newVal
            }
        })
    }
    // 闭包: 能够读取其他函数内部变量的函数  
    // 闭包本质: 将函数内部和函数外部连接起来的一座桥梁
    // 闭包 只要 $data 的引用不释放 obj, key, val 就一直存在
    // key 与 dep 挂钩 
    defineReactive(obj, key, val) {
        // 递归
        this.observe(val)
        // 创建 Dep 实例 Dep 与 key 是一对一对应
        const dep = new Dep()
        Object.defineProperty(obj, key, {
            get() {
                // 将 Dep.target 指向的 Watcher 实例加入到 Dep 中
                Dep.target && dep.addDep(Dep.target)
                console.log(`获取到${key}的值${val}`)
                return val
            },
            set(newVal) {
                if (newVal !== val) {
                    val = newVal
                    // console.log(`${key}属性更新了 ${key}的值为${val}`)
                    // 通过 dep 做通知
                    console.log('dep',dep,new Dep())
                    dep.notify() 
                }
            }
        })
    }
}
// Dep: 管理若干 watcher 实例，与 key 是一对一的关系
class Dep {
    constructor() {
        this.deps = []
    }
    addDep(watcher) {
        this.deps.push(watcher)
    }
    // 通知 Watcher 做更新
    notify() {
        this.deps.forEach(dep => dep.update())
    }
}
// 保存 UI 中的依赖，实现 update 函数可以更新之
class Watcher {
    constructor(vm, key, cb) {
        this.vm = vm
        this.key = key
        this.cb = cb

        // 将当前实例指向 Dep.target
        Dep.target = this
        this.vm[this.key] // 读一次 key 触发 getter
        Dep.target = null
    }
    // 更新
    update() {
        // console.log(`${this.key}属性更新了`)
        this.cb.call(this.vm, this.vm[this.key])
    }
}