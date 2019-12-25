# min-vue
#### 通过 observe() 方法 和 defineReactive() 方法 对数据进行循环遍历

#### 通过 proxyData() 方法将数据挂载到 Vue 实例 $el 上

#### 在 defineReactive() 方法中通过 Object.defineProperty(obj, key, {})  实现数据的 getter 函数和 setter 函数

#### 在 getter 函数中将 Dep.target 指向的 Watcher 实例加入到 Dep 中

#### 在 setter 函数中通过 dep.notify() 做更新通知

引用vue => vue为构造函数，需要传入构造参数
```js
// testCompile.html script
new RXVue({
    data: {
        msg: 'hello'
    }
})
```
构造参数 + options + 数据响应化 + 创建编译器

fn1.call(fn2) 使得 fn1对象的this指向了fn2
```js
class RXVue {
    constructor(options){
        this.$options = options
        this.$data = options.data
        this.observe(this.$data)
        new Compile(options.el, this)
        if (options.created) {
            options.created.call(this)
        }
    }
}
```
### **递归遍历 使传递进来的对象响应化**

判断传入的值是否是 object 类型，如果是则继续向深一层次做遍历，如果不是则结束遍历

```js
observe(value) {
    if (!value || typeof value !== 'object'){
        return
    }
    Object.keys(value).forEach(key => {
        this.defineReactive(value, key, value[key])
        this.proxyData(key)
    })
}
```
### **this.proxyData(key)**

在 vue 根上定义属性代理 data 中的数据

通过 this = el 可以从实例上直接获取数据
```js
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
```
闭包: 能够读取其他函数内部变量的函数  

闭包本质: 将函数内部和函数外部连接起来的一座桥梁

闭包 只要 $data 的引用不释放 obj, key, val 就一直存在

key 与 dep 挂钩
### **defineReactive(obj, key, val)** 
调用 `this.observe(val)` 对数据做递归操作

创建 Dep 实例，Dep 与 key 是一对一的关系

通过 Object.defineProperty 实现数据的 getter 和 setter 函数

在 getter 函数中将 Dep.target 指向的 Watcher 实例加入到 Dep 中

在 setter 函数中通过 Dep.notify() 做更新通知
```js
defineReactive(obj, key, val) {
    this.observe(val)
    const dep = new Dep()
    Object.defineProperty(obj, key, {
        get() {
            Dep.target && dep.addDep(Dep.target)
            return val
        },
        set(newVal) {
            if (newVal !== val) {
                val = newVal·   
                console.log('dep',dep,new Dep())
                dep.notify() 
            }
        }
    })
} 
```

### **Dep: 管理若干 watcher 实例**
Dep: 管理若干 watcher 实例，与 key 是一对一的关系
```js
class Dep {
    constructor() {
        this.deps = []
    }
    addDep(watcher) {
        this.deps.push(watcher)
    }
    notify() {
        this.deps.forEach(dep => dep.update())
    }
}
```

### **Watcher: 保存 UI 中的依赖，实现 update 函数可以更新之**
Dep.target = this  将当前实例指向 Dep.target

this.vm[this.key] 读一次 key 触发 getter

Dep.target = null 释放内存
```js
class Watcher {
    constructor(vm, key, cb) {
        this.vm = vm
        this.key = key
        this.cb = cb
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
```