# min-compile
遍历模板 将里面的插值表达式处理，如果发现 rx-xx，@xx做特别处理
```js
const ruixue0702 = new RXVue({
    el:'#app',
    data: {
        name: "I am test.",
        age:12,
        html:'<button>这是一个按钮</button>'
    },
    created(){
        setTimeout(()=>{this.name='我是测试'}, 1500)
    },
    methods:{
        changeName(e){
            this.name = '哈喽，开课吧'
            this.age = 1
        }
    }
})
```
#### Compile 参数 el(Dom 宿主) vm(Vue 实例)
```js
this.$vm = vm
this.$el = document.querySelector(el)
```
#### 将 $el 中的内容搬家到一个 fragment 提高操作效率
### **遍历 el  编译 fragment  将编译结构追加到宿主中**
```js
node2Fragment(el) {
    const fragment = document.createDocumentFragment()
    let child
    while ((child = el.firstChild)) {
        fragment.appendChild(child)
    }
    return fragment
}
```
### **遍历 el  递归子元素  替换动态值  处理指令v-和事件@**
```js
compile(el) { 
    const childNodes = el.childNodes
    Array.from(childNodes).forEach(node => {
        if (this.isElement(node)) {
            this.compileElement(node)
        } else if (this.isInterpolation(node)) {
            this.compileText(node);
        }
        // 递归子元素
        if (node.childNodes && node.childNodes.length > 0) {
            this.compile(node)
        }
    })
}
```
#### **判断当前节点是否是 Dom 元素**
```js
isElement(node) {
    return node.nodeType === 1
}
```
#### **判断当前节点是否是插值表达式 {{xx}}**
```js
// .* 若干字符
isInterpolation(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
}
```
#### **编译插值表达式中的文本**
{{xxx}} RegExp.$1 是匹配分组部分
```js
compileText(node) {
    node.textContent = this.$vm[RegExp.$1]
    const exp = RegExp.$1
    this.update(node, this.$vm, exp, 'text')
}
```
#### **编译元素**
- 查看 node 的特性中是否有 rx-xx @xx
- 获取属性的名称 attr.name 和值 attr.value
- 属性名中是否包含 rx-  @
- rx- 执行对应指令的方法(text model html)
- @ 执行对应 eventHandler方法
```js
compileElement(node) {
    const nodeAttrs = node.attributes
    Array.from(nodeAttrs).forEach(attr => {
        // 获取属性的名称和值 rx-text=‘abc‘
        const attrName = attr.name // rx-text
        const exp = attr.value //abc
        if (attrName.indexOf('rx-') === 0) {
            const dir = attrName.substring(3) // text
            this[dir] && this[dir](node, this.$vm, exp)
        } else if (attrName.indexOf('@') === 0) {
            const eventName = attrName.substring(1) //click
            this.eventHandler(node, this.$vm, exp, eventName)
        }
    })
}
```
#### **v-text**
```js
// textContent
text(node, vm, exp) {
    this.update(node, vm, exp, 'text')
}
textUpdator(node, value) {
    node.textContent = value
}
```
#### **v-model**
```js
// 双向数据绑定  addEventListener('input)  value
model(node, vm, exp) {
    this.update(node, this.$vm, exp, 'model')
    node.addEventListener('input', e => {
        vm[exp] = e.target.value
    })
}
modelUpdator(node, value) {
    node.value = value
}
```
#### **v-html**
```js
// innerHTML
html(node, vm, exp) {
    this.update(node, this.$vm, exp, 'html')
}
htmlUpdator(node, value) {
    node.innerHTML = value
}
```
#### **@ 获取回调函数**
```js
eventHandler(node, vm, exp, eventName) {
    const fn = vm.$options.methods && vm.$options.methods[exp]
    if (eventName && fn) {
        node.addEventListener(eventName, fn.bind(vm))
    }
}
```
#### **update 函数 可复用**
- 创建watcher 
- exp 是表达式 
- dir 是具体操作：text，html，model
```js
update(node, vm, exp, dir) {
    const fn = this[dir + 'Updator']
    fn && fn(node, vm[exp])
    new Watcher(vm, exp, function() {
        fn && fn(node,vm[exp])
    })
}
```