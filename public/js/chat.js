(function () {
    var chatApp = {
        uiBoxes: {
            msgInput: document.getElementById('msgInput'),
            msgList: document.getElementById('msgList'),
            sendMsgBtn: document.getElementById('sendMsg'),
            friendList: document.getElementById('friendList'),
            chatMsgBox: document.getElementById('chatMsgBox'),
            loginDlg: document.getElementById('loginDlg'),
            chatWindow: document.getElementById('chatWindow')
        },
        init: function (user) {
            this.userInfo = user;
            this.friends = [];
            this.socket = this.connect(location.host);
            this.socket.emit('login', this.userInfo);
            this.getFriends(user, this.renderFriends.bind(this));
        },
        parseQuery: function (query) {
            query = (query || location.search).replace(/^\?/i, '');

            var params = query.split('&');
            var pairs = [];
            var obj = {};

            for (var i = 0, len = params.length; i < len; i++) {
                pairs = params[0].split('=');
                obj[pairs[0]] = pairs[1];
            }

            return obj;
        },
        connect: function (url) {
            var socket = io.connect(url);
            var that = this;

            socket.on('login', function () {
                // alert('login');
            });

            socket.on('notes', function (notes) {
                that.showNotifications.bind(that)(notes);
            });

            socket.on('created', function () {
                socket.emit('messages');
                that.showChatBox();
            });

            socket.on('message', function (data) {
                console.log('message', data);
                if (data.from.id !== that.userInfo.id && data.toMembers.indexOf(that.userInfo.id + '') > -1) {
                    if (that.talkingFriend && data.toMembers.indexOf(that.talkingFriend.id + '') > -1) {
                        that.addMsg(data);
                    } else {
                        that.addNote(data);    
                    }
                }
            });

            socket.on('messages', function (messages) {
                console.log('messages', messages);
                that.addMsg(messages, true);
            });

            this.socket = socket;

            return socket;
        },
        addEventListers: function () {
            // this.uiBoxes.sendMsgBtn.addEventListener('click', this.sendMsg.bind(this), false);
            this.uiBoxes.msgInput.addEventListener('keypress', this.inputKeypressHandle.bind(this), false);
            document.getElementById('start-chat-btn').addEventListener('click', this.startChat.bind(this), false);
            document.getElementById('register-btn').addEventListener('click', this.registeHandle.bind(this), false);
            this.bindEvent(document, 'click', '#friendList > li', this.selectFriend.bind(this));
            this.bindEvent(document, 'click', '#toolbarSmileIcon', this.openIconsPopup.bind(this));
            this.bindEvent(document, 'click', '#toolbarSmileIcon li', this.selectIcon.bind(this));
        },
        bindEvent: function (proxyDom, eventName, selector, handler) {
            proxyDom.addEventListener(eventName, function (e) {
                console.log('bindEvent', e);
                var matchedEles = proxyDom.querySelectorAll(selector);
                var canMathched = function (proxyDom, matchedEles, target) {
                    do {
                        if (target === proxyDom) {
                            return false;
                        }
                        if ([].indexOf.call(matchedEles, target) > -1) {
                            return true;
                        }
                    } while (target = target.parentNode)

                    return false;
                };

                if (canMathched(proxyDom, matchedEles, e.target)) {
                    handler && handler(e);
                }
            }, false);
        },
        selectFriend: function (e) {
            var target = e.target;
            var id = +target.getAttribute('data-id');
            var friend = this.friends.filter(function (item) {
                return item.id === id;
            })[0];
            var note = target.querySelector('.msg-note');

            this.removeClass(target.parentNode.querySelector('li.selected'), 'selected');
            this.addClass(target, 'selected');
            this.addClass(note, 'hide');
            if (note) {
                note.innerHTML = '';    
            }
            this.createRoom(friend);
            this.talkingFriend = friend;
            this.socket.emit('setMsgRead', [this.userInfo.id, friend.id]);
        },
        createRoom: function (friend) {
            this.socket.emit('createRoom', {
                roomId: this.userInfo.id + '-' + friend.id
            });
        },
        showChatBox: function () {
            this.toggleClass(this.uiBoxes.chatMsgBox, 'hide', false);
            this.uiBoxes.msgInput.focus();
        },
        toggleClass: function (dom, className, isAdd) {
            if (!dom) {
                return;
            }
            var classNames = dom.getAttribute('class') || '';
            var classList = classNames.split(' ');
            var hasClass = this.hasClass(dom, className);

            if (typeof isAdd === 'undefined') {
                isAdd = !hasClass;
            }

            if (isAdd && !hasClass) {
                classList.push(className);
            }

            if (!isAdd && hasClass) {
                classList.splice(classList.indexOf(className), 1);
            }

            dom.setAttribute('class', classList.join(' '));
        },
        hasClass: function (dom, className) {
            if (!dom) {
                return;
            }
            var classNames = dom.getAttribute('class') || '';
            var classList = classNames.split(' ');

            return classList.indexOf(className) > -1;
        },
        addClass: function (dom, className) {
            this.toggleClass(dom, className, true);
        },
        removeClass: function (dom, className) {
            this.toggleClass(dom, className, false);
        },
        sendMsg: function (e) {
            var val = this.uiBoxes.msgInput.innerHTML;
            var msg = {
                type: 'text', // 暂时只支持text
                content: val,
                from: this.userInfo
            };

            this.socket.emit('message', msg);
            this.uiBoxes.msgInput.innerHTML = '';
            this.addMsg(msg);
        },
        inputKeypressHandle: function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                this.sendMsg();
            }
        },
        addMsg: function (data, isClear) {
            console.log('recive msg');
            if (!(data instanceof Array)) {
                data = [data];
            }

            if (isClear) {
                this.uiBoxes.msgList.innerHTML = '';
            }

            for (var i = 0, len = data.length; i < len; i++) {
                var msgEl = document.createElement('li');
                var msgText = document.createElement('p');
                var msg = data[i];

                msg.from = msg.from || {
                    id: data[i].fromUserId,
                    name: data[i].username
                };

                msgText.className = 'msg-content';

                if (msg.from.id === this.userInfo.id) {
                    msgText.className += ' from-self';
                    msgEl.className += 'msg-self';
                }

                // msgText.innerHTML = msg.from.name + ':' + msg.content;
                msgText.innerHTML = msg.content;
                msgEl.appendChild(this.createAvartarIcon(msg.from));
                msgEl.appendChild(msgText);
                this.uiBoxes.msgList.appendChild(msgEl);
            }
            this.uiBoxes.msgList.scrollTop = this.uiBoxes.msgList.scrollHeight;
        },
        createAvartarIcon: function (user) {
            var avartar = document.createElement('img');
            avartar.setAttribute('src', user.avartar || '/img/naruto.png');
            avartar.setAttribute('class', 'avartar');
            return avartar;
        },
        addNote: function (data) {
            var friendItem = this.uiBoxes.friendList.querySelector('li[data-id="' + data.from.id + '"]');
            var noteEl = friendItem.querySelector('.msg-note');
            var msgCount = 0;

            if (noteEl) {
                msgCount = +noteEl.innerHTML;
                msgCount++;
                noteEl.innerHTML = msgCount;
                this.removeClass(noteEl, 'hide');
            } else {
                noteEl = document.createElement('span');
                noteEl.setAttribute('class', 'msg-note');
                noteEl.innerHTML = 1;
                friendItem.appendChild(noteEl);
            }
        },
        renderFriends: function (friends) {
            var fragement = document.createDocumentFragment();
            var friendItem;
            this.friends = friends;

            for (var i = 0, len = friends.length; i < len; i++) {
                friendItem = document.createElement('li');
                friendItem.setAttribute('class', 'firend-item');
                friendItem.setAttribute('data-id', friends[i].id);
                this.toggleClass(friendItem, 'friend-self', friends[i].id === this.userInfo.id);
                friendItem.appendChild(this.createAvartarIcon(friends[i]));
                friendItem.appendChild(document.createTextNode(friends[i].name));
                // friendItem.innerHTML = friends[i].name;
                fragement.appendChild(friendItem)
            }

            this.uiBoxes.friendList.innerHTML = '';
            this.uiBoxes.friendList.appendChild(fragement);

            if (this.notes) {
                this.showNotifications(this.notes);    
            }
        },
        showNotifications: function (notesObj) {
            this.nodes = notesObj;
            if (!this.uiBoxes.friendList) {
                return;
            }

            var frientList = this.uiBoxes.friendList.cloneNode(true);

            for (var key in notesObj) {
                var nodeEl = document.createElement('span');

                nodeEl.setAttribute('class', 'msg-note');
                nodeEl.innerHTML = notesObj[key];

                friendList.querySelector('li[data-id="' + key + '"]').appendChild(nodeEl);    
            }
            this.uiBoxes.chatWindow.replaceChild(this.uiBoxes.friendList, friendList);
        },
        getFriends: function (params, callback) {
            this.ajax({
                url: '/users',
                method: 'get',
                success: function (friends) {
                    callback && callback(friends);        
                }
            });
        },
        ajax: function (option) {
            var xhr = new XMLHttpRequest();
            var parseRequest = function (data, method) {
                if (!data) {
                    return '';
                }

                var result = '';

                if (/get/i.test(method)) {
                    for (var key in data) {
                        result += key + '=' + data[key] + '&';
                    }
                    result = result.replace(/&$/, '');
                } else {
                    result = JSON.stringify(data);
                }

                return result;
            };
            var request = parseRequest(option.data, option.method);
            
            xhr.open(option.method, option.url + '?' + request, true);
            xhr.setRequestHeader('content-type', 'application/json;charset=utf-8');
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var response = xhr.response || xhr.responseText;
                        response = response ? JSON.parse(xhr.response || xhr.responseText) : response;
                        typeof option.success === 'function' && option.success(response);
                    } else {
                        alert('获取服务列表失败');
                    }
                }
            };

            xhr.send(request);
        },
        startChat: function (e) {
            var that = this;
            var username = document.getElementById('username-input').value;

            this.ajax({
                url: '/users/search',
                method: 'get',
                data: {
                    name: username
                },
                success: function (user) {
                    if (user) {
                        that.getFriends({}, that.renderFriends.bind(that));
                        that.uiBoxes.loginDlg.remove();
                        chatApp.init(user);
                    } else {
                        alert('该用户名不存在，请确认是否输入有误，如果是新用户，请点击新用户');
                    }
                }
            });
        },
        registeHandle: function (e) {
            var that = this;
            var username = document.getElementById('username-input').value;

            this.ajax({
                url: '/users',
                method: 'POST',
                data: {
                    name: username
                },
                success: function (user) {
                    that.getFriends({}, that.renderFriends.bind(that));
                    that.uiBoxes.loginDlg.remove();
                    chatApp.init(user);
                }
            });
        },
        openIconsPopup: function (e) {
            console.log(':)');
            this.removeClass(document.querySelector('#toolbarIconsPopup'), 'hide');
        },
        selectIcon: function (e) {
            var target = e.target;
            this.addClass(document.querySelector('#toolbarIconsPopup'), 'hide');
            this.addIconToInput(e);
            e.stopPropagation();
        },
        addIconToInput: function (e) {
            var icon = e.target.cloneNode(true);
            icon.setAttribute('class', 'small-icon');
            this.uiBoxes.msgInput.appendChild(icon);
            this.uiBoxes.msgInput.focus();
        },
        renderIcons: function () {
            var icons = [
                { id: 1, src: '/img/1.png' },
                { id: 2, src: '/img/2.png' },
                { id: 3, src: '/img/3.png' },
                { id: 4, src: '/img/4.png' },
                { id: 5, src: '/img/5.png' },
                { id: 6, src: '/img/6.png' },
                { id: 7, src: '/img/7.png' },
                { id: 8, src: '/img/8.png' },
                { id: 9, src: '/img/9.png' },
                { id: 10, src: '/img/10.png' },
                { id: 11, src: '/img/11.png' },
                { id: 12, src: '/img/12.png' },
                { id: 13, src: '/img/13.png' },
                { id: 14, src: '/img/14.png' }
            ];
        }
    };

    chatApp.addEventListers();

    var queryObj = chatApp.parseQuery();

    if (queryObj.name) {
        document.getElementById('username-input').value = queryObj.name;
        document.getElementById('start-chat-btn').click();
    }
})();