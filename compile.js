/* eslint-disable no-unused-vars */
// 遍历模板 将里面的插值表达式处理
// 另外如果发现 rx-xx，@xx做特别处理
class Compile {
    constructor(el, vm) {
        this.$vm = vm
        this.$el = document.querySelector(el)
        if (this.$el) {
            // $el 中的内容搬家到一个 fragment 提高操作效率
            this.$fragment = this.node2Fragment(this.$el)
            console.log(this.$fragment)
            // 编译 fragment
            this.compile(this.$fragment)
            // 将编译结构追加至宿主中
            this.$el.appendChild(this.$fragment)
        }
    }
    // 遍历 el，把里面的内容搬到新创建的 fragment 中
    // fragment：分片 Dom 编程
    node2Fragment(el) {
        const fragment = document.createDocumentFragment()
        let child
        while ((child = el.firstChild)) {
            fragment.appendChild(child)
        }
        return fragment
    }
    //   把动态值替换，把指令和事件做处理
    compile(el) {
        // 遍历 el 
        const childNodes = el.childNodes
        Array.from(childNodes).forEach(node => {
            if (this.isElement(node)) {
                console.log('编译元素：' + node.nodeType)
                // 如果是元素节点 需要处理指令 rx-xx 事件@xx
                this.compileElement(node)
            } else if (this.isInterpolation(node)) {
                console.log('编译文本：' + node.textContent)
                this.compileText(node);
            }
            // 递归子元素
            if (node.childNodes && node.childNodes.length > 0) {
                this.compile(node)
            }
        })
    }
    isElement(node) {
        return node.nodeType === 1
    }
    // 插值表达式判断
    isInterpolation(node) {
        // 需满足 {{xx}} 
        // .* 若干字符
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }
    compileElement(node) {
        // 查看 node 的特性中是否有 rx-xx @xx
        console.log('node', node)
        const nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach(attr => {
            // 获取属性的名称和值 rx-text=‘abc‘
            const attrName = attr.name // rx-text
            const exp = attr.value //abc
            console.log(attrName, attrName.indexOf('rx-') === 0)
            // 指令 rx-xx
            if (attrName.indexOf('rx-') === 0) {
                const dir = attrName.substring(3) // text
                console.log('dir', dir, node)
                // 执行指令
                this[dir] && this[dir](node, this.$vm, exp)
            } else if (attrName.indexOf('@') === 0) {
                // 事件 @click = "handleClick"
                const eventName = attrName.substring(1) //click
                this.eventHandler(node, this.$vm, exp, eventName)
            }
        })
    }
    text(node, vm, exp) {
        // 通过 this.update 执行 this.textUpdator
        this.update(node, vm, exp, 'text')
    }
    // 双向数据绑定
    model(node, vm, exp) {
        // update 数值变了改界面
        this.update(node, this.$vm, exp, 'model')
        // update 界面变了改数值
        node.addEventListener('input', e => {
            vm[exp] = e.target.value
        })
    }
    modelUpdator(node, value) {
        node.value = value
    }
    html(node, vm, exp) {
        // update 数值变了改界面
        this.update(node, this.$vm, exp, 'html')
        // update 界面变了改数值
    }
    htmlUpdator(node, value) {
        node.innerHTML = value
    }
    eventHandler(node, vm, exp, eventName) {
        // 获取回调函数
        const fn = vm.$options.methods && vm.$options.methods[exp]
        if (eventName && fn) {
            node.addEventListener(eventName, fn.bind(vm))
        }
    }
    // 把插值表达式替换为实际内容
    compileText(node) {
        // {{xxx}}
        // RegExp.$1 是匹配分组部分
        console.log(RegExp.$1)
        node.textContent = this.$vm[RegExp.$1]
        const exp = RegExp.$1
        this.update(node, this.$vm, exp, 'text')
    }
    // 编写 update 函数 可复用
    // exp 是表达式 dir 是具体操作：text，html，model
    update(node, vm, exp, dir) {
        const fn = this[dir + 'Updator']
        fn && fn(node, vm[exp])
        // 创建watcher
        // new Vue({
        //     data: {
        //         xxx: 'ddd'
        //     }
        // })
        // vm 就是 new Vue()
        // exp 就是 xxx
        new Watcher(vm, exp, function() {
            fn && fn(node,vm[exp])
        })
    }
    textUpdator(node, value) {
        console.log('node', value)
        node.textContent = value
    }
}
