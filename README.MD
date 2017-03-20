# 当前版本：
0.0.1

# 原理：
原理最近在写博客，正准备上传到博客中，到时候上传好这里会贴上地址

# 用法：
1. 在html页面中导入tinRequire.js文件，并指明data-main：

    `<script src="tinRequire.js" data-main="main"></script>`
    
2. 在当前目录下创建main.js文件，并且使用require导入：
<pre><code>
    require(["a"],function(a){
        console.log("main.js");
        a.test();
    });
</code></pre>
3. 在当前目录下创建a.js文件：
<pre><code>
    define("a",["b"],function(b){
        function test(){
            console.log("test in a");
        }
        b.test();
        return {test:test};
    });
</code></pre>    
4. 在当前目录下创建b.js文件：
<pre><code>
    define("b",[],function(req,exports,module){
        function test(){
            console.log("test in b");
        }
        return {test:test};
    });
</code></pre>    
5. 运行html页面，即可看到结果

# 说明
tinRequireJS主要的作用是了解requireJS的运行原理。去掉了很多代码，只保留了基本功能。
因此本库的功能是想当有限的。

# 安全
请不要将本库用于产品环境，本库只是一个requireJS运行原理的缩小版，主要用于学习，所有功能都是未经测试的。

