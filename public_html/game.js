var GAME = (function ($, lang, env) {
    var gameValues = {
        text: {
            load: {
                fr: "CHARGEMENT",
                en: "LOADING"
            },
            error: {
                fr: "PARTIE TERMINÉE",
                en: "GAME OVER"
            },
            gameOver: {
                title: {
                    fr: "<span style='font-size:0.7em;'>PARTIE TERMINÉE</span>",
                    en: "GAME OVER"
                },
                text: {
                    fr: "Oups! Vous avez atteint votre limite de 5 tours par jour.  <br/> Veuillez revenir demain.",
                    en: "Oops! It looks like you've reached your limit of 5 plays per day. <br/> Come back tomorrow to play again!"
                }
            },
            run: {
                other: {
                    fr: "TOUR ",
                    en: "RUN "
                },
                final: {
                    fr: "<span style='font-size:0.65em'>DERNIER <br/><br/> TOUR</span>",
                    en: "FINAL <br/><br/> RUN"
                }
            },
            level: {
                fr: "NIVEAU",
                en: "LEVEL"
            },
            again: {
                fr: "Oups! Réessayer.",
                en: "Oops! Try again."
            },
            share: {
                fr: "PARTAGER: ",
                en: "SHARE: "
            },
            cancel: {
                fr: "Cancel",
                en: "Annuler"
            },
            exit: {
                fr: "QUITTER ",
                en: "EXIT "
            },
            tryAgain: {
                fr: "RÉESSAYER ",
                en: "TRY AGAIN "
            },
            or: {
                fr: "OU",
                en: "OR"
            },
            extraLives: {
                firstPart: {
                    fr: "Pour ",
                    en: "For an extra "
                },
                secondPart: {
                    fr: "vies en plus",
                    en: "lives"
                }
            },
            score: {
                fr: "Votre score est ",
                en: "Your score is "
            },
            challenge: {
                fr: "Mettez vos amis au défi de battre votre score!",
                en: "Challenge your friends to beat your score!"
            },
            facebook: {
                title: {
                    fr: "Le Concours Course au supermarché de webSaver.ca",
                    en: "The webSaver.ca Supermarket Run contest"
                },
                description: {
                    fr: "Je viens juste d’obtenir un score de {0} points en jouant à la Course au supermarché, pour une chance de gagner une carte-cadeau de 100 $ à l’épicerie! Je te mets au défi de battre mon score. Connecte-toi avec ton compte ou bien inscris-toi à webSaver.ca et joue pour une chance de gagner une carte-cadeau de 100 $ à l’épicerie*. *Voir les règlements officiels pour la liste complète des magasins. ",
                    en: "I just scored {0} points playing Supermarket Run for a chance to win a $100 grocery gift card! I challenge YOU to beat my score. Log-in with your webSaver.ca account Or register to webSaver.ca & play for a chance to win a $100 grocery gift card*. *Please see official rules for full store listings"
                }
            }
        },
        token: {
            element: "#tk"
        },
        imageUrl: window.location.protocol + '//' + window.location.host + '/bundles/bamwebsaver/images/',
        imgShadow: window.location.protocol + '//' + window.location.host + '/bundles/bamwebsaver/images/items/others/shadow.png',
        htmlElements: {
            lives: {
                element: '#game-lives',
                value: 3
            },
            score: {
                element: '#game-run',
                value: 0
            },
            timer: {element: "#time"},
            playBtn: {element: "#game-playBtn"},
            levelText: {element: "#game-level-number"},
            title: {element: "#game-notify"}
        },
        level: {},
        levelsAchived: [],
        currentLevel: 1,
        currentIntervals: [],
        bonusPoint: 2,
        mainScore: 0,
        hasShared: false
    };

    var animatingShelves = [
        {
            element: "#shelve1",
            class: "websaver_shelve1"
        }
        ,
        {
            element: "#shelve2",
            class: "websaver_shelve2"
        }
        ,
        {
            element: "#shelve3",
            class: "websaver_shelve3"
        }
        ,
        {
            element: "#shelve4",
            class: "websaver_shelve4"
        }
    ];

    var imagesLevel = {};

    //Get Json and Save data on the server
    var ajax = function (method, callback) {
        //console.log("Ajax request " + method.type);
        $.ajax({
            url: gameValues.ajaxURL,
            type: method.type,
            data: method.data,
            success: function (data)
            {
                callback(data);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                if (jqXHR.status === 401) {
                    $(gameValues.htmlElements.title.element).html(gameValues.text.error[lang]).fadeIn(1000);
                }
                //console.log(jqXHR, textStatus, errorThrown);
            }
        });
    };

    //Manage html
    var generateImagesOnShelves = function (images) {
        var url = gameValues.imageUrl + 'items/';

        var shoppingList = [];
        //console.log('GENERATE');
        //Generate images
        for (var key in images) {
            var arr = images[key];
            var names = arr.src.split(".");
            $(arr.element + '-container').append('<div class= "img-box"><img data-name="' + names[0] + '" src="' + url + arr.src + '" class="' + arr.class + '"/></div>');

            //Used to generate the shopping list 
            if (arr.class.search("gotya") !== -1) {
                shoppingList.push(names[0]);
            }
        }
        gameValues.shoppingList = shoppingList;
        //console.log(gameValues.shoppingList)

    };

    var startAnimation = function (level) {
        //console.log('animation')

        for (var index in animatingShelves) {
            var imagesClass = animatingShelves[index].class;

            animation(imagesClass);
        }

        function animation(elementClass) {

            var w = 88;
            var l = 40;

            $('.' + elementClass).height(l);

            function slider() {
                $('.' + elementClass).parent().first().animate({marginLeft: -w},
                        level.speed, "linear", function () {
                            $(this).appendTo($(this).parent()).css({marginLeft: 0});
                            slider();
                        });
            }

            slider();

        }
    };

    var init = function () {
        var currentLevel = gameValues.currentLevel;
        $(gameValues.htmlElements.title.element).html(gameValues.text.load[lang] + '<span>.</span><span>.</span><span>.</span>').show();

        //Retrieve images
        ajax({
            type: "GET",
            data: {
                nbShelves: animatingShelves.length,
                ws_optin: window.localStorage.getItem('ws_optin')
            }
        }, function (res) {
            //console.log(res)

            //Run number
            gameValues.run = parseInt(res.play.run) + 1;

            if (res.play.auth === 'none') {
                //TODO
                var options = {
                    title: gameValues.text.gameOver.title[lang],
                    content: gameValues.text.gameOver.text[lang],
                    condition: false
                };
                modal.share(options);
            } else {
                //console.log('play here')
                imagesLevel = res.img;
                gameValues.level = res.levels;

                // Init score, lives, timer
                $(gameValues.htmlElements.lives.element).html("x" + gameValues.htmlElements.lives.value);
                $('#live_3,#live_2,#live_1').show();

                if (gameValues.run == 5)
                    $(gameValues.htmlElements.score.element).html(gameValues.text.run.final[lang]);
                else
                    $(gameValues.htmlElements.score.element).html(gameValues.text.run.other[lang] + '<br/><br/>' + gameValues.run + '/5');

                //remove overlay
                $('#game-overlay').hide();
                $(gameValues.htmlElements.title.element).hide(); //Hide loading

                var formattedTime = ("0" + gameValues.level[1].timer).slice(-2);
                $(gameValues.htmlElements.timer.element).html(formattedTime.toString());

                //console.log(gameValues)

                //Token field
                $(gameValues.token.element).val(res.tk);

                gameManager(currentLevel);

            }

            $(gameValues.htmlElements.title.element).empty();
        });

    };

    var initShoppingList = function () {

        function orderingList() {
            var num_cols = 2, container = $('.split-list'), listItem = 'li', listClass = 'sub-list';
            container.each(function () {
                var items_per_col = new Array(),
                        items = $(this).find(listItem),
                        min_items_per_col = Math.floor(items.length / num_cols),
                        difference = items.length - (min_items_per_col * num_cols);

                for (var i = 0; i < num_cols; i++) {
                    if (i < difference) {
                        items_per_col[i] = min_items_per_col + 1;
                    } else {
                        items_per_col[i] = min_items_per_col;
                    }
                }

                var left = 0;
                for (var i = 0; i < num_cols; i++) {

                    var ul = $('<ul></ul>').addClass(listClass);
                    if (i === (num_cols - 1)) {
                        ul.css("margin-top", "-2px");
                    }

                    $(this).append(ul);
                    for (var j = 0; j < items_per_col[i]; j++) {
                        var pointer = 0;

                        for (var k = 0; k < i; k++) {
                            pointer += items_per_col[k];
                        }

                        var list = items[j + pointer];
                        if (i === (num_cols - 1)) {
                            $(list).css("margin-left", left + "px");
                            left += 3;
                        }

                        $(this).find('.' + listClass).last().append(list);
                    }
                }
            });
        }

        if (gameValues.shoppingList !== undefined) {
            var url = gameValues.imageUrl + 'items/';

            $('.split-list').empty();
            for (var i = 0; i < gameValues.shoppingList.length; i++) {
                var img = gameValues.shoppingList[i];
                $('.split-list').append('<li style="list-style:none!important;" data-name="' + img + '"><img class="list-fruit" src="' + url + img + '.png"/><img class="shadow" src="' + gameValues.imgShadow + '"/><img class="check-fruit" style="margin: -134px 0 0 12px;display:none;" src="' + url + 'others/checkmark.png"/></li>');
            }
            orderingList();
        }

    };

    var gameOver = function () {
        function disableGame() {
            for (var key in animatingShelves) {
                var imagesClass = animatingShelves[key].class;
                $('.' + imagesClass).remove();
            }

            //console.log('disable game');
            for (i = 0; i < gameValues.currentIntervals.length; i++) {
                clearInterval(gameValues.currentIntervals[i]);
            }
            $('#game *').attr('disabled', true);
            $('#game *').unbind("click");
            $('#game-overlay').show();

        }

        disableGame();


        ajax({
            type: "POST",
            data: {
                score: gameValues.htmlElements.score.value,
                levelAchieved: gameValues.levelsAchived,
                token: $(gameValues.token.element).val(),
                sharedFb: gameValues.hasShared
            }
        }, function (res) {
            //console.log(res);

            //TODO
            var options = {
                title: gameValues.text.gameOver.title[lang],
                content: gameValues.text.challenge[lang],
                condition: false
            };

            if (res.play.auth === 'all') {
                options.content = gameValues.text.extraLives.firstPart[lang] + ' <img style="margin-bottom:10px;" src="' + gameValues.imageUrl + '/items/others/lives.png"/> ' + gameValues.text.extraLives.secondPart[lang];
                options.condition = true;
                modal.playMore(options);
            } else if (res.play.auth === 'sharing') {
                options.content = gameValues.text.extraLives.firstPart[lang] + ' <img style="margin-bottom:10px;" src="' + gameValues.imageUrl + '/items/others/lives.png"/> ' + gameValues.text.extraLives.secondPart[lang];
                options.lives = true;
                options.token = res.data_sent.tk;
                options.score = res.data_sent.score;
                modal.gameOver(options);
            } else {
                options.score = res.data_sent.score;
                options.token = res.data_sent.tk;
                modal.gameOver(options);
            }
        });
    };

    var nextLevel = function () {
        var failed = $("#game *").hasClass("gotya");
        // Did not click on every items to level up
        if (failed) {
            return false;
        }
        return true;

    };

    var gameManager = function (currentLevel) {
        function nb_level() {
            var count = 0;
            for (var k in gameValues.level) {
                if (gameValues.level.hasOwnProperty(k)) {
                    ++count;
                }
            }
            return count;
        }

        // each time users repeat the same level
        if (gameValues.run == 5)
            $(gameValues.htmlElements.score.element).html(gameValues.text.run.final[lang]);
        else
            $(gameValues.htmlElements.score.element).html(gameValues.text.run.other[lang] + '<br/><br/>' + gameValues.run + '/5');

        if (currentLevel <= nb_level()) {
            //console.log('Level ' + currentLevel);
            gameValues.tempScore = 0;
            //Clean html elements
            for (var key in animatingShelves) {
                $(animatingShelves[key].element + '-container').empty();
            }

            // There is more level
            $('#game-overlay').show();
            $(gameValues.htmlElements.title.element).html(gameValues.text.level[lang] + " " + gameValues.level[currentLevel].text).fadeIn(1000);

            $.when($(gameValues.htmlElements.title.element).fadeOut()).done(function () {
                $('#game-overlay').hide();
                $.when(generateImagesOnShelves(imagesLevel[currentLevel])).done(function () {
                    initShoppingList();
                    startAnimation(gameValues.level[currentLevel]);
                    countdown(gameValues.level[currentLevel].timer);
                    $(gameValues.htmlElements.levelText.element).html(gameValues.level[currentLevel].text).fadeIn();
                });


                //Click event
                $('.gotya').click(function () {
                    //console.log("click", this);

                    if (gameValues.audioBg.paused) {
                        gameValues.audioClick.pause();
                    } else {
                        //Play audio scan barcode
                        gameValues.audioClick.volume = 0.8;
                        gameValues.audioClick.play();
                    }


                    var n = $(this).attr("data-name");
                    $('#shelves').find('[data-name="' + n + '"]').remove();

                    //Hide product from the list item instead of checking
                    //$('.sub-list li[data-name="' + n + '"]').find(".check-fruit").show();
                    $('.sub-list li[data-name="' + n + '"]').hide();

                    //Bouncing the basket
                    $("#game-basket").fadeIn(100).animate({bottom: "-=1%"}, 200).animate({bottom: "+=1%"}, 200).animate({bottom: "-=1%"}, 200)
                            .animate({bottom: "+=1%"}, 200).animate({bottom: "-=1%"}, 200).animate({bottom: "+=1%"}, 200);

                    // store the score temporarily until users take it the next level
                    gameValues.tempScore += 200;
                });

            });

            return;
        }

        //No more level
        gameOver();

    };

    var clock = {
        start: function (sec) {
            var totaltime = sec;
            if (gameValues.clockInterval !== undefined) {
                clearInterval(gameValues.clockInterval);
            }

            function update(percent) {
                var deg;
                if (percent < (totaltime / 2)) {
                    deg = 90 + (360 * percent / totaltime);
                    $('.pie').css('background-image', 'linear-gradient(' + deg + 'deg, transparent 50%, white 50%),linear-gradient(90deg, white 50%, transparent 50%)');
                } else if (percent >= (totaltime / 2)) {
                    deg = -90 + (360 * percent / totaltime);
                    $('.pie').css('background-image', 'linear-gradient(' + deg + 'deg, transparent 50%, #B4D79D 50%),linear-gradient(90deg, white 50%, transparent 50%)');
                }
                $('.seconds').css({
                    'transform': 'rotate(' + (360 * percent / totaltime) + 'deg)',
                    '-ms-transform': 'rotate(' + (360 * percent / totaltime) + 'deg)',
                    '-webkit-transform': 'rotate(' + (360 * percent / totaltime) + 'deg)'
                });
            }

            var count = 0;
            gameValues.clockInterval = setInterval(function () {
                count += 1;
                update(count);

                if (count === totaltime)
                    clearInterval(gameValues.clockInterval);
            }, 1000);
        },
        reset: function () {
            $('.seconds').css({
                'transform': 'rotate(0deg)',
                '-ms-transform': 'rotate(0deg)',
                '-webkit-transform': 'rotate(0deg)'
            });
            clearInterval(gameValues.clockInterval);
            $('.pie').css('background-image',
                    'linear-gradient(90deg, transparent 50%, white 50%),linear-gradient(90deg, white 50%, transparent 50%)'
                    );
        }
    };

    var countdown = function (sec) {
        //console.log('countdown');
        var seconds = sec;

        function removeLife() {
            //console.log('remove life')
            gameValues.htmlElements.lives.value--;
            $(gameValues.htmlElements.lives.element).html("x" + gameValues.htmlElements.lives.value.toString());

            if (0 >= gameValues.htmlElements.lives.value <= 3) {
                switch (gameValues.htmlElements.lives.value) {
                    case 0:
                        $('#live_3,#live_2,#live_1').hide();
                        break;
                    case 1:
                        $('#live_1,#live_2').hide();
                        break;
                    case 2:
                        $('#live_1').hide();
                        break;
                    case 3:
                        $('#live_3,#live_2,#live_1').show();
                        break;
                    default:
                        $('#live_3,#live_2,#live_1').show();
                        break;
                }
            }
        }

        function tick() {
            var current_seconds = seconds - 1;
            seconds--;

            if (current_seconds < 0)
                current_seconds = 0;

            var formattedTime = ("0" + current_seconds).slice(-2);
            $(gameValues.htmlElements.timer.element).html(formattedTime.toString());

            //users finish the level before the time is up
            var changeLevel = nextLevel();
            if (changeLevel === true) {
                clock.reset(); //Reset clock
                $('.split-list').empty(); //Reset shopping list

                //Store new values
                gameValues.mainScore = gameValues.mainScore + gameValues.tempScore;
                gameValues.htmlElements.score.value = gameValues.htmlElements.score.value + gameValues.tempScore + (gameValues.bonusPoint * current_seconds);
                var achieved = {
                    "Level": gameValues.currentLevel,
                    "Bonus": gameValues.bonusPoint * current_seconds,
                    "Score": gameValues.mainScore,
                    "TotalScore": gameValues.htmlElements.score.value,
                    "Time": gameValues.level[gameValues.currentLevel].timer - current_seconds
                };
                gameValues.levelsAchived.push(achieved);
                gameValues.currentLevel = gameValues.currentLevel + 1;

                gameManager(gameValues.currentLevel);
            } else {
                if (seconds >= 0) {
                    gameValues.currentTimeout = setTimeout(tick, 1000);
                } else {
                    //console.log(gameValues.levelsAchived)
                    removeLife();
                    if (gameValues.htmlElements.lives.value > 0) {
                        //TODO 
                        //Show overlay
                        //console.log('overlay');
                        $('#game-overlay').show();
                        $('#shelves').hide();
                        $(gameValues.htmlElements.title.element).html(gameValues.text.again[lang] + "<br/><br/><br/><br/>" + gameValues.text.level[lang] + " " + gameValues.currentLevel).show();


                        setTimeout(function () {
                            $('#game-overlay').hide();
                            $('#shelves').show();
                            gameManager(gameValues.currentLevel);
                        }, 3000);

                    } else {
                        gameOver();
                    }
                }
            }
        }
        tick();
        clock.start(seconds);
    };

    function showDialog(options) {
        //Stop background music
        gameValues.audioBg.pause();

        //Show overlay
        $('#game-overlay').show();

        //Hide shelves : didn't find a way to stop the animation
        $('#shelves').hide();

        options = $.extend({
            id: 'orrsDiag',
            title: null,
            subtitle: null,
            text: null,
            negative: false,
            positive: false,
            cancelable: true,
            condition: false,
            contentStyle: null,
            onLoaded: false,
            twitter: false,
            gameover: false
        }, options);

        // remove existing dialogs
        $('.dialog-container').remove();
        $(document).unbind("keyup.dialog");

        $('<div id="' + options.id + '" class="dialog-container"><div class="mdl-card"><div id="dialog-choices"></div></div></div>').appendTo("body");
        var dialog = $('#orrsDiag');
        var content = dialog.find('.mdl-card');
        var dialogChoices = dialog.find('#dialog-choices');
        if (options.contentStyle != null)
            content.css(options.contentStyle);

        if (options.title != null && options.subtitle != null) {
            var title = '<div id="popup-gameover-title-one">' + options.title + '</div>';
            var subtitle = '<div id="popup-gameover-subtitle">' + options.subtitle + '</div>';
            $('<div id="popup-gameover-title">' + title + subtitle + '</div>').prependTo(content);
        } else {
            $('<div class="lockup-title-modal lockup-onlyTitle-modal">' + options.title + '</div>').prependTo(content);
        }

        var shareFb = "<img style='cursor:pointer;padding:0 5px;' id='fb-share-btn' src='" + gameValues.imageUrl + "items/others/fb.png'/>";
        var shareTw = "<img id='tw-share-btn' style='cursor:pointer;' src='" + gameValues.imageUrl + "items/others/tw.png'/>";

        if (options.twitter === false) {
            var share = shareFb;
        } else {
            var share = shareFb + " " + shareTw;
        }

        if (options.gameover === false && options.text != null) {
            var moreSpace = "";
            if (options.condition === false)
                moreSpace = 'style = "width:60%; padding-left: 12%;"';

            $('<div class="dialog-button-bar-left" ' + moreSpace + '><span class="breelight">' + options.text + '</span><div><span class="riffic">' + gameValues.text.share[lang] + '</span> ' + share + '</div></div>').appendTo(dialogChoices);
        } else {
            $('<div class="breelight text-center">' + options.text + '</div><div class="text-center" style="padding-top: 25px;"><span class="riffic">' + gameValues.text.share[lang] + '</span> ' + share + '</div>').appendTo(dialogChoices);
        }

        if (options.condition === true) {
            var or = $('<div class="breelight" style="float:left;width:10%;margin-top:44px;">- ' + gameValues.text.or[lang] + ' -</div>');
            or.appendTo(dialogChoices);
        }

        if (options.negative || options.positive) {
            var buttonBar = $('<div class="mdl-card__actions dialog-button-bar-right" style="margin-top:16px;"></div>');
            if (options.positive) {
                options.positive = $.extend({
                    id: 'positive',
                    title: 'OK',
                    onClick: function () {
                        return false;
                    }
                }, options.positive);
                var posButton = $('<button style="display:block;" class="riffic mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" id="' + options.positive.id + '">' + options.positive.title + '</button>');
                posButton.click(function (e) {
                    e.preventDefault();
                    if (!options.positive.onClick(e))
                        hideDialog(dialog)
                });
                posButton.appendTo(buttonBar);
            }

            if (options.negative) {
                options.negative = $.extend({
                    id: 'negative',
                    title: gameValues.text.cancel[lang],
                    onClick: function () {
                        return false;
                    }
                }, options.negative);
                var negButton = $('<button style="display:block;" class="riffic mdl-button mdl-js-button mdl-js-ripple-effect" id="' + options.negative.id + '">' + options.negative.title + '</button>');
                negButton.click(function (e) {
                    e.preventDefault();
                    if (!options.negative.onClick(e))
                        hideDialog(dialog)
                });
                negButton.appendTo(buttonBar);
            }
            buttonBar.appendTo(dialogChoices);
        }

        if (options.score != null) {
            $('<div class="breelight text-center">' + gameValues.text.score[lang] + '<span class="riffic" style="color: #62a709;">' + options.score + '</span></div>').insertBefore('.dialog-button-bar-left');
        }

        componentHandler.upgradeDom();
        if (options.cancelable) {
            dialog.click(function () {
                hideDialog(dialog);
            });
            $(document).bind("keyup.dialog", function (e) {
                if (e.which == 27)
                    hideDialog(dialog);
            });
            content.click(function (e) {
                e.stopPropagation();
            });
        }

        var h = document.documentElement.scrollHeight;

        setTimeout(function () {
            dialog.css({opacity: 1, height: h});
            if (options.onLoaded)
                options.onLoaded();
        }, 1);
    }

    function hideDialog(dialog) {
        $(document).unbind("keyup.dialog");
        dialog.css({opacity: 0});

        //Hide overlay
        $('#game-overlay').hide();
        $('#shelves').show();

        setTimeout(function () {
            dialog.remove();
        }, 400);
    }

    var modal = {
        playMore: function (options) {
            $.when(showDialog({
                title: options.title,
                subtitle: gameValues.text.run.other[lang] + '' + gameValues.run + '/5',
                text: options.content,
                score: gameValues.htmlElements.score.value,
                negative: {
                    title: gameValues.text.exit[lang] + '>',
                    onClick: function () {
                        var token = $(gameValues.token.element).val();
                        window.location = window.location.href + "over?t=" + token;
                    }
                },
                positive: {
                    title: gameValues.text.tryAgain[lang] + '>',
                    onClick: function () {
                        //Play audio background
                        gameValues.audioBg.volume = 0.2;
                        gameValues.audioBg.play();

                        gameValues.currentLevel = 1;
                        gameValues.htmlElements.score.value = 0;
                        gameValues.levelsAchived = [];
                        gameValues.htmlElements.lives.value = 3;
                        init();
                    }
                },
                cancelable: false,
                contentStyle: {top: $(window).scrollTop() - 50},
                condition: (typeof options.condition !== 'undefined') ? options.condition : false
            })).then(function () {
                $('#fb-share-btn').click(function () {
                    FB.init({
                        appId: '197140640414527',
                        xfbml: true,
                        version: 'v2.9'
                    });
                    FB.ui(
                            {
                                method: 'share_open_graph',
                                action_type: 'og.shares',
                                action_properties: JSON.stringify({
                                    object: {
                                        'og:url': document.URL, // your url to share
                                        'og:title': gameValues.text.facebook.title[lang],
                                        'og:description': gameValues.text.facebook.description[lang].replace("{0}", gameValues.htmlElements.score.value),
                                        'og:image': gameValues.imageUrl + 'items/others/image_fb_share.jpg'
                                    }
                                })
                            },
                            function (response) {
                                if (response && !response.error_code) {
                                    gameValues.hasShared = true;

                                    //Play audio background
                                    gameValues.audioBg.volume = 0.2;
                                    gameValues.audioBg.play();

                                    gameValues.htmlElements.lives.value = 3;
                                    $(gameValues.htmlElements.lives.element).html("x" + gameValues.htmlElements.lives.value);
                                    $('#live_3,#live_2,#live_1').show();

                                    hideDialog($('#orrsDiag'));
                                    gameManager(gameValues.currentLevel);
                                    //console.log('Posting completed.');
                                } else {
                                    modal.playMore(options);
                                }
                            });
                });
            });
        },
        gameOver: function (options) {
            $.when(showDialog({
                title: options.title,
                subtitle: gameValues.text.run.final[lang].replace("<br/><br/>", ""),
                text: options.content,
                score: options.score,
                negative: {
                    title: gameValues.text.exit[lang] + '>',
                    onClick: function () {
                        window.location = window.location.href + "over?t=" + options.token;
                    }
                },
                cancelable: false,
                contentStyle: {top: $(window).scrollTop() - 50}
            })).then(function () {
                $('#fb-share-btn').click(function () {
                    FB.init({
                        appId: '197140640414527',
                        xfbml: true,
                        version: 'v2.9'
                    });
                    FB.ui(
                            {
                                method: 'share_open_graph',
                                action_type: 'og.shares',
                                action_properties: JSON.stringify({
                                    object: {
                                        'og:url': document.URL, // your url to share
                                        'og:title': gameValues.text.facebook.title[lang],
                                        'og:description': gameValues.text.facebook.description[lang].replace("{0}", gameValues.htmlElements.score.value),
                                        'og:image': gameValues.imageUrl + 'items/others/image_fb_share.jpg'
                                    }
                                })
                            },
                            function (response) {
                                if (response && !response.error_code && options.lives === true) {
                                    //console.log("fb -> "+ response)
                                    gameValues.hasShared = true;

                                    gameValues.htmlElements.lives.value = 3;
                                    $(gameValues.htmlElements.lives.element).html("x" + gameValues.htmlElements.lives.value);
                                    $('#live_3,#live_2,#live_1').show();

                                    hideDialog($('#orrsDiag'));
                                    gameManager(gameValues.currentLevel);
                                    //console.log('Posting completed.');
                                } else {
                                    //console.log("modal")
                                    modal.gameOver(options);
                                }
                            });
                });
            });
        },
        share: function (options) {
            $.when(showDialog({
                title: options.title,
                text: options.content,
                cancelable: false,
                gameover: true,
                twitter: true,
                contentStyle: {top: $(window).scrollTop() - 50}
            })).then(function () {
                $('#fb-share-btn').click(function () {
                    FB.init({
                        appId: '197140640414527',
                        xfbml: true,
                        version: 'v2.9'
                    });
                    FB.ui(
                            {
                                method: 'share_open_graph',
                                action_type: 'og.shares',
                                action_properties: JSON.stringify({
                                    object: {
                                        'og:url': document.URL, // your url to share
                                        'og:title': gameValues.text.facebook.title[lang],
                                        'og:description': gameValues.text.facebook.description[lang].replace("{0}", gameValues.htmlElements.score.value),
                                        'og:image': gameValues.imageUrl + 'items/others/image_fb_share.jpg'
                                    }
                                })
                            },
                            function (response) {
                                window.location = window.location.href;
                            });
                });

                $('#tw-share-btn').click(function () {
                    window.open("https://twitter.com/intent/tweet?url=" + document.URL, '_blank');
                });
            });
        }
    };


    $(document).ready(function () {

        if (env === "prod") {
            gameValues.ajaxURL = window.location.protocol + '//' + window.location.host + "/en_ca/contests/summer-contest/game/json"
        } else {
            gameValues.ajaxURL = window.location.protocol + '//' + window.location.host + "/app_" + env + ".php/en_ca/contests/summer-contest/game/json"
        }

        gameValues.audioBg = document.getElementById('audio');
        gameValues.audioClick = document.getElementById('audio_click');

        $('.audio-btn').click(function () {
            if (gameValues.audioBg.paused) {
                gameValues.audioBg.play();
                $('.audio-active').show();
                $('.audio-inactive').hide();
            } else {
                gameValues.audioBg.pause();
                $('.audio-active').hide();
                $('.audio-inactive').show();
            }
        });

        $(gameValues.htmlElements.playBtn.element).click(function () {
            //Play audio background
            gameValues.audioBg.volume = 0.2;
            gameValues.audioBg.play();

            $(this).remove();
            init();
        });


    });

    return {
        clock: clock,
        modal: modal
    };
}(jQuery, langWebsite, env));