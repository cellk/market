var GAME = (function ($) {
    var gameValues = {
        slick: false,
        token: {
            element: "#tk"
        },
        ajaxURL: window.location.protocol + '//' + window.location.host + "/app_local.php/en_ca/contests/summer-contest/game/json",
        imageUrl: window.location.protocol + '//' + window.location.host + '/bundles/bamwebsaver/images/',
        imgShadow: window.location.protocol + '//' + window.location.host + '/bundles/bamwebsaver/images/items/others/shadow.png',
        htmlElements: {
            lives: {
                element: '#game-lives',
                value: 3
            },
            score: {
                element: '#game-score',
                value: 0
            },
            timer: {element: "#time"},
            playBtn: {element: "#game-playBtn"},
            levelText: {element: "#game-level-number"},
            title: {element: "#game-notify"}
        },
        level: {
            1: {
                speed: 450,
                timer: 60,
                text: "LEVEL 1"
            },
            2: {
                speed: 300,
                timer: 10,
                text: "LEVEL 2"
            }
//            ,
//            3: {
//                speed: 350,
//                timer: 15
//            },
//            4: {
//                speed: 250,
//                timer: 10
//            },
//            5: {
//                speed: 100,
//                timer: 5
//            },
//            6: {
//                speed: 50,
//                timer: 5
//            }
        },
        currentLevel: 1,
        currentIntervals: []
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
        console.log("Ajax request " + method.type);
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
                console.log(jqXHR, textStatus, errorThrown);
            }
        });
    };

    //Manage html
    var generateImagesOnShelves = function (images) {
        var url = gameValues.imageUrl + 'items/';

        //Token field
        $(gameValues.token.element).val(gameValues.token.value);

        var shoppingList = [];

        //Generate images
        for (var key in images) {
            var arr = images[key];
            var names = arr.src.split(".");
            $(arr.element + '-container').append('<img data-name="' + names[0] + '" src="' + url + arr.src + '" class="' + arr.class + '"/>');

            //Used to generate the shopping list 
            if (arr.class.search("gotya") !== -1) {
                shoppingList.push(names[0]);
            }
        }
        gameValues.shoppingList = shoppingList;
        console.log(gameValues.shoppingList)

    };

    var startAnimation = function (level) {
        console.log('animation')
        //Clean intervals
        for (i = 0; i < gameValues.currentIntervals.length; i++) {
            clearInterval(gameValues.currentIntervals[i]);
        }

        for (var index in animatingShelves) {
            var mainElement = animatingShelves[index].element;
            var imagesClass = animatingShelves[index].class;

            animation(mainElement, imagesClass);
        }

        function animation(element, elementClass) {
            //var w = 20;
            var l = 40;

            $('.' + elementClass).height(l);

            $(element + '-container').width(660);
            $(element + '-container').slick({
                infinite: true,
                autoplay: true,
                arrows: false,
                slidesToShow: 7,
                slidesToScroll: 2,
                variableWidth: true,
                speed: level.speed,
                autoplaySpeed: level.speed,
                pauseOnHover: false,
                pauseOnFocus: false
            });

            //Let the script knows that slick is used
            gameValues.slick = true;


//            function slider() {
//                $('.' + elementClass).first().animate({
//                    marginLeft: -w
//                }, level.speed, function () {
//                     $(this).appendTo($(this).parent()).css({marginLeft: 0});
//                });
//            }
//
//            //setInterval on DOM ready
//            var i = setInterval(slider, level.speed + 50);
//            gameValues.currentIntervals.push(i);
        }
    }

    var init = function () {
        // Refreshing browser leads to game over
        if (cookie.read()) {
            gameOver();
        } else {
            var currentLevel = gameValues.currentLevel;
            $(gameValues.htmlElements.title.element).html('<p class="saving">Loading<span>.</span><span>.</span><span>.</span></p>').fadeIn(1000);

            //Retrieve images
            ajax({
                type: "GET",
                data: {nbShelves: animatingShelves.length, nbLevels: nb_level()}
            }, function (res) {
                console.log("data received")
                imagesLevel = res.img;
                gameValues.token.value = res.tk;
                gameManager(currentLevel);
                cookie.set("true");
            });
        }
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
                $('.split-list').append('<li style="list-style:none!important;" data-name="' + img + '"><img class="list-fruit" src="' + url + img + '.png"/><img class="shadow" src="' + gameValues.imgShadow + '"/></li>');
            }
            orderingList();
        }

    };

    var gameOver = function () {

        function disableGame() {
            $(gameValues.htmlElements.title.element).html("GAME OVER").fadeIn(1000);
            console.log('disable game');
            for (i = 0; i < gameValues.currentIntervals.length; i++) {
                clearInterval(gameValues.currentIntervals[i]);
            }
            $('#game *').attr('disabled', true);
            $('#game *').unbind("click");

        }

        disableGame();

        return;
        ajax({
            type: "POST",
            data: {
                score: gameValues.htmlElements.score.value,
                levelAchieved: gameValues.currentLevel,
                token: $(gameValues.token.element).val()
            }
        }, function (res) {
            //Redirect user to a thank you page
            console.log(res);
            return;
        });
    };

    var nextLevel = function () {
        var failed = $("#game *").hasClass("gotya");
        // Did not click on all the items to level up
        if (failed) {
            return false;
        }

        $('.split-list').empty();

        //Reset clock
        clock.reset();

        gameValues.currentLevel = gameValues.currentLevel + 1;
        gameValues.htmlElements.score.value = gameValues.htmlElements.score.value + gameValues.tempScore;
        return true;

    };

    var nb_level = function () {
        var count = 0;
        for (var k in gameValues.level) {
            if (gameValues.level.hasOwnProperty(k)) {
                ++count;
            }
        }
        return count;
    };

    var gameManager = function (currentLevel) {
        // each time users repeat the same level
        $(gameValues.htmlElements.score.element).html(gameValues.htmlElements.score.value);

        if (gameValues.slick === true) {
            for (var key in animatingShelves) {
                $(animatingShelves[key].element + '-container').slick('unslick');
            }
        }

        if (currentLevel <= nb_level()) {
            console.log('Level ' + currentLevel);
            gameValues.tempScore = 0;
            //Clean html elements
            for (var key in animatingShelves) {
                $(animatingShelves[key].element + '-container').empty();
            }

            // There is more level
            $(gameValues.htmlElements.title.element).html(gameValues.level[currentLevel].text).fadeIn(1000);

            setTimeout(function () {
                $.when($(gameValues.htmlElements.title.element).fadeOut()).done(function () {
                    $.when(generateImagesOnShelves(imagesLevel[currentLevel])).done(function () {
                        initShoppingList();
                        startAnimation(gameValues.level[currentLevel]);
                        countdown(gameValues.level[currentLevel].timer);
                        $(gameValues.htmlElements.levelText.element).html(gameValues.level[currentLevel].text).fadeIn();
                    });


                    //Click event
                    $('.gotya').click(function () {
                        console.log("click", this);
                        //$(this).remove();

                        var n = $(this).attr("data-name");
                        $('#shelves').find('[data-name="' + n + '"]').remove();

                        //Check list item
                        $('.sub-list li[data-name="' + n + '"]').css("list-style", "");

                        //Bouncing the basket
                        $("#game-basket").fadeIn(100).animate({top: "-=20px"}, 200).animate({top: "+=20px"}, 200).animate({top: "-=20px"}, 200)
                                .animate({top: "+=20px"}, 200).animate({top: "-=20px"}, 200).animate({top: "+=20px"}, 200);

                        // store the score temporarily until users take it the next level
                        gameValues.tempScore += 200;
                        var temporaryScore = gameValues.tempScore + gameValues.htmlElements.score.value;
                        $(gameValues.htmlElements.score.element).html(temporaryScore.toString());
                    });

                });
            }, 3000);

            return;
        }

        //No more level
        gameOver();

    };

    var cookie = {
        set: function (val) {
            //Expire at the end of the session
            $.cookie("websaverGame", val);
        },
        read: function () {
            return $.cookie("websaverGame");
        },
        del: function () {
            $.removeCookie("websaverGame");
        }
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
            $('.pie').css('background-image',
                    'linear-gradient(90deg, transparent 50%, white 50%),linear-gradient(90deg, white 50%, transparent 50%)'
                    );
        }
    };

    var countdown = function (sec) {
        console.log('countdown');
        var seconds = sec;

        function removeLife() {
            console.log('remove life')
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
            $(gameValues.htmlElements.timer.element).html(current_seconds.toString());

            //users finish the level before the time is up
            var changeLevel = nextLevel();
            if (changeLevel === true) {
                //console.log('change level', gameValues.currentLevel);
                gameManager(gameValues.currentLevel);
            } else {
                if (seconds >= 0) {
                    gameValues.currentTimeout = setTimeout(tick, 1000);
                    //console.log(gameValues.currentTimeout)
                } else {
                    removeLife();
                    if (gameValues.htmlElements.lives.value > 0) {
                        alert('play again');
                        gameManager(gameValues.currentLevel);
                    } else {
                        for (var key in animatingShelves) {
                            $(animatingShelves[key].element + '-container').slick('unslick');
                        }
                        gameOver();
                        cookie.del();
                    }
                }
            }
        }
        tick();
        clock.start(seconds);
    };




    $(document).ready(function () {
        // Init score, lives, timer
        $(gameValues.htmlElements.lives.element).html("x" + gameValues.htmlElements.lives.value);
        $(gameValues.htmlElements.score.element).html(gameValues.htmlElements.score.value);
        $(gameValues.htmlElements.timer.element).html(gameValues.level[1].timer);

        $(gameValues.htmlElements.playBtn.element).click(function () {
            $(this).remove();
            init();
        });
    });

    return {
        start: init,
        cookie: cookie,
        clock: clock
    };
}(jQuery));
