var requirejs,require,define;
(function(global) {

    var req,s,head,
    version="0.0.1",
    cfg={},
    dataMain,
    op = Object.prototype,
    ostring = op.toString,
    hasOwn = op.hasOwnProperty,
    ap = Array.prototype,
    apsp = ap.splice,
    contexts = {},
    isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
    defContextName = '_',
    globalDefQueue = [];

    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }
    
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }
    function scripts() {
        return document.getElementsByTagName('script');
    }
    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }
    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }
    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    //建立一个新的context的函数
    function newContext(contextName) {
        var context,
        requireCounter = 1,
        registry={},/**  */
        enabledRegistry={},
        defined = {},
        urlFetched = {},
        defQueue = [];

        function normalize(name, baseName, applyMap) {
            return name;
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
            mod = getOwn(registry, id);

            
            mod = getModule(depMap);
            if (mod.error && name === 'error') {
                fn(mod.error);
            } else {
                mod.on(name, fn);
            }
            
        }
        //将globalDefQueue保存到context中的defQueue
        function takeGlobalQueue() {
            if (globalDefQueue.length) {
                //Array splice in the value
                apsp.apply(defQueue,
                           [defQueue.length, 0].concat(globalDefQueue));
                globalDefQueue = [];
            }
        }

        function intakeDefines() {
            var args;
            //将globalDefQueue保存到context中的defQueue
            takeGlobalQueue();

            //当context中的defQueue有的话
            while (defQueue.length) {
                //取出一个
                args = defQueue.shift();
                if (args[0] === null) {
                    console.log("模块名不匹配，请指定一个模块名");
                    return;
                } else {
                    
                    callGetModule(args);
                }
            }
        }

        Module = function (map) {
            this.events = {};
            this.map = map;
            this.depCount = 0;
            this.depExports=[];
        };

        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var isDefine = true,
            url,
            originalName = name,
            isDefine=true,
            parentName=null,
            suffix='',
            normalizedName='';

            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            if(name){
                normalizedName = normalize(name, parentName, applyMap);
                isNormalized = true;
                url = context.nameToUrl(normalizedName);

            }
            return {
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: normalizedName
            };
        }

        function checkLoaded() {
            eachProp(enabledRegistry,function (mod) {
                var map = mod.map,
                    modId = map.id;
                

            });
        }

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};
                //防止错多被初始化
                if (this.inited) {
                    return;
                }
                //成功的回调函数
                this.factory = factory;
                //模块的依赖
                this.depMaps = depMaps && depMaps.slice(0);

                //
                if (errback) {
                    this.on('error', errback);
                }
                //错误回调函数
                this.errback = errback;
                //表明模块已经进行过初始化了
                this.inited = true;

                if (options.enabled || this.enabled) {
                    this.enable();
                }else {
                    this.check();
                }
            },
            fetch:function(){
                if (this.fetched) {
                    return;
                }
                this.fetched = true;
                var map = this.map;

                return this.load();
            },
            load:function(){
                var url = this.map.url;
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },
            check:function(){
                if (!this.enabled || this.enabling) {
                    return;
                }
                var id = this.map.id 
                ,factory = this.factory,
                depExports = this.depExports,
                exports = this.exports;

                if (!this.inited) {
                    //未进行初始化，则进行初始化，同时会创建script元素加载脚本
                    this.fetch();
                } else if (!this.defining) {
                    this.defining = true;

                    //所有的模块都加载好了
                    if(this.depCount<1 ){
                        if(isFunction(factory)){
                            exports = context.execCb(id, factory, depExports, exports);
                        }
                        //加入到defined中
                        defined[id] = exports;
                        //将借口暴露同时从registry中清除掉该模块
                        cleanRegistry(id);

                        this.defined = true;

                    }else{
                        //这里可以模块还没有加载好，可以不用设置定时器加载，因为依赖最后也会重新执行这个方法
                    }


                    this.exports = exports;

                    this.defining = false;
                    //每当有一个模块加载好，都会出发绑定在父模块的defined事件
                    if (this.defined && !this.defineEmitted) {
                        
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }
                }
                

            },
            defineDep:function(i, depExports){
                //已加载的依赖的数量
                this.depCount -= 1;
                //加入依赖的接口
                this.depExports[i] = (depExports ===undefined ? {}:depExports);
            },
            enable: function () {
                enabledRegistry[this.map.id] = this;
                //表明模块已经被enable
                this.enabled = true;
                //正在enabling
                this.enabling = false;
                //遍历模块的依赖
                each(this.depMaps, bind(this, function (depMap, i) {
                    //
                    if (typeof depMap === 'string') {
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap),
                                               false,
                                               !this.skipMap);
                        //将字符串替换为ModuleMap
                        this.depMaps[i] = depMap;
                        //模块的依赖，用于判定模块的所有依赖是否加载完毕
                        this.depCount += 1;
                        
                        //所依赖的每个模块成功被导入之后执行该回调函数。on函数会调用getModule
                        on(depMap, 'defined', bind(this, function (depExports) {
                            //模块的依赖减1
                            this.defineDep(i, depExports);
                            //用于检查模块的依赖是否全部加载完成
                            this.check();
                        }));

                    }
                    //获取module
                    id = depMap.id;
                    mod = registry[id];
                    //enable刚刚创建的module
                    if (mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }))

                this.enabling = false;
                this.check();

            },
            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    delete this.events[name];
                }
            }
        }
        function callGetModule(args) {

            if (!hasProp(defined, args[0])) {
                //args[0]为name,[1]为依赖，[2]为回调函数
                getModule(makeModuleMap(args[0], null, true)).init(args[1],args[2]);
            }
        }
        //获取脚本的信息，同时删除掉监听器
        function getScriptData(evt) {

            var node = evt.currentTarget;

            //Remove the listeners once here.
            node.removeEventListener('load',context.onScriptLoad);
            node.removeEventListener('error',context.onScriptError);

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        context={
            nextTick: req.nextTick,
            Module: Module,
            configure:function(cfg){
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },
            makeRequire:function(relMap){
                function localRequire(deps, callback, errback){
                    var requireMod;

                    context.nextTick(function () {

                        requireMod = getModule(makeModuleMap(null, relMap));

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                    })

                    return localRequire;

                }

                return localRequire;
            },
            completeLoad: function (moduleName) {
                var mod;
                intakeDefines();
                mod = getOwn(registry, moduleName);
                if (!hasProp(defined, moduleName) && mod && !mod.inited) {
                    //对于没有define的，则通过moduleName获得在registry中的module，调用inited
                    callGetModule([moduleName]);
                }
                
                checkLoaded();

            },
            load: function (id, url) {
                req.load(context, id, url);
            },
            nameToUrl:function(name){
                return './'+name+'.js';
            },
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },
            enable: function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },
            onScriptLoad: function (evt) {

                if(evt.type === 'load'){
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            }

        }

        context.require = context.makeRequire();
        return context;

    }

    req = requirejs = function(deps, callback, errback){
        var context, 
            contextName = defContextName,config;

        if (!isArray(deps) && typeof deps !== 'string') {
            config = deps;
            deps = [];
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
            return;
        }

        if (config) {
            context.configure(config);
            return;
        }

        return context.require(deps,callback);
        

    }
    
    
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //定时器
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) { fn(); };


    if (!require) {
        require = req;
    }
    req.version = version;

    //初始化
    req({});

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
    }

    //创建script元素
    req.createNode = function (config, moduleName, url) {
        var node = config.xhtml ?
                document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                document.createElement('script');
        node.type = config.scriptType || 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        return node;
    };

    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
        node;
        if (isBrowser) {
            node = req.createNode(config, moduleName, url);

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            node.addEventListener('load', context.onScriptLoad, false);
            node.addEventListener('error', context.onScriptError, false);

            node.src = url;
            head.appendChild(node);
            return node;
        }
    }

    
    //遍历所有的script元素，读取data-main属性
    if(isBrowser){
        eachReverse(scripts(),function(script){
            //读取data-main属性
            dataMain = script.getAttribute('data-main');

            if(dataMain){
                cfg.deps = cfg.deps ? cfg.deps.concat(dataMain) : [dataMain];
                return true;
            }else{
                console.log("script元素没有设置data-main属性，请设置。");
            }
        });
    }

    define = function (name, deps, callback) {
        globalDefQueue.push([name, deps, callback]);
    }

    //开始加载
    req(cfg);
})(this)