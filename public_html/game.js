var GAME = (function ($) {
    var gameValues = {
        lives: {
            element: '#game-lives',
            value: 3
        },
        score: {
            element: '#game-score',
            value: 0
        },
        level: {
            1: {
                speed: 700,
                timer: 200
            },
            2: {
                speed: 750,
                timer: 20
            },
            3: {
                speed: 500,
                timer: 15
            },
            4: {
                speed: 250,
                timer: 10
            },
            5: {
                speed: 100,
                timer: 5
            }
        },
        currentLevel: 1,
        currentIntervals: []
    };

    var animatingShelves = [
        {
            element: "#shelve1",
            class: "websaver_shelve1",
            images_show: 5
        }
//        ,
//        {
//            element: "#shelve2",
//            class: "websaver_shelve2",
//            images_show: 6
//        }
//        ,
//        {
//            element: "#shelve3",
//            class: "websaver_shelve3",
//            images_show: 6
//        }
//        ,
//        {
//            element: "#shelve4",
//            class: "websaver_shelve4",
//            images_show: 6
//        }
    ];

    var imagesLevel = {};

    //Manage html
    var generateImagesOnShelves = function (images) {
        //Clean html elements
        for (var key in animatingShelves) {
            $(animatingShelves[key].element + '-container').empty();
        }

        //Generate images
        for (var key in images) {
            var arr = images[key];
            $(arr.element + '-container').append('<img src="' + arr.src + '" class="' + arr.class + '"/>');
        }
    };

    var startAnimation = function (level) {
        //Clean intervals
        for (i = 0; i < gameValues.currentIntervals.length; i++) {
            clearInterval(gameValues.currentIntervals[i]);
        }

        for (var index in animatingShelves) {
            var mainElement = animatingShelves[index].element;
            var imagesClass = animatingShelves[index].class;
            var nb_images = animatingShelves[index].images_show;

            animation(mainElement, imagesClass, nb_images);
        }

        function animation(element, elementClass, imageToShow) {
            //each slides width depending on how many images to show
            //var w = $(element).width() / imageToShow;
            //var l = $('.' + elementClass).length;
            var w = 29;
            var l = 35;


            //set each slide width
            $('.' + elementClass).width(w);
            $('.' + elementClass).height(l);

            //set the container width
            //$(element + '-container').width(w * l);
            $(element + '-container').width(660);

            console.log(w, l);

            function slider() {
                //animate only the first slide on the left, all the slides after will just follow
                $('.' + elementClass).first().animate({
                    marginLeft: -w
                }, level.speed, function () {
                    //once completely hidden, move this slide next to the last slide
                    //and reset the margin-left to 0
                    $(this).appendTo($(this).parent()).css({marginLeft: 0});
                });
            }

            //setInterval on DOM ready
            var i = setInterval(slider, level.speed + 50);
            gameValues.currentIntervals.push(i);
        }
    }

    var init = function () {
        ajax({
            url: "https://sywebsaver.local/app_local.php/en_ca/contests/fun-in-the-sun/game/images",
            type: "GET",
            data: {nbShelves: animatingShelves.length, nbLevels: nb_level()}
        }, function (res) {
            console.log(res);
            imagesLevel = res;
            gameManager(gameValues.currentLevel);
        }, function () {
            console.log('error');
        });

    };

    var nextLevel = function () {
        var failed = $("#game *").hasClass("gotya");
        // Did not click on all the items to level up
        if (failed) {
            return false;
        }

        gameValues.currentLevel = gameValues.currentLevel + 1;
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
        if (currentLevel <= nb_level()) {
            // There is more level
            generateImagesOnShelves(imagesLevel[currentLevel]);
            startAnimation(gameValues.level[currentLevel]);
            countdown(gameValues.level[currentLevel].timer);

            //Click event
            $('.gotya').click(function () {
                console.log(this);
                $(this).remove();
                gameValues.score.value += 200;
                $(gameValues.score.element).html(gameValues.score.value.toString());
            });

            return;
        }

        //No more level
        console.log('No more level');
    };

    //Get Json and Save data on the server
    var ajax = function (method, callback, callbackError) {
        console.log("Ajax request");
        $.ajax({
            url: method.url,
            type: method.type,
            data: method.data,
            success: function (data)
            {
                callback(data);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                callbackError;
                console.log(jqXHR, textStatus, errorThrown);
            }
        });
    }

    var countdown = function (sec) {
        var seconds = sec;

        function disableGame() {
            console.log('disable game')
            for (i = 0; i < gameValues.currentIntervals.length; i++) {
                clearInterval(gameValues.currentIntervals[i]);
            }
            $('#game *').attr('disabled', true);
            $('#game *').unbind("click");
        }

        function removeLife() {
            console.log('remove life')
            gameValues.lives.value--;
            $(gameValues.lives.element).html(gameValues.lives.value.toString());
        }

        function tick() {
            var counter = document.getElementById("game-timer");
            var current_seconds = seconds - 1;
            seconds--;
            counter.innerHTML = current_seconds.toString() + " s";

            //users finish the level before the time is up
            var changeLevel = nextLevel();
            if (changeLevel === true) {
                console.log('change level', gameValues.currentLevel);
                gameManager(gameValues.currentLevel);
            } else {
                if (seconds > 0) {
                    gameValues.currentTimeout = setTimeout(tick, 1000);
                    //console.log(gameValues.currentTimeout)
                } else {
                    removeLife();
                    if (gameValues.lives.value > 0) {
                        alert('start again');
                        gameManager(gameValues.currentLevel);
                    } else {
                        disableGame();
                        alert('game over');
                        //ajax(method, callback, callbackError);
                    }
                }
            }
        }
        tick();
    };

    return {
        start: init,
        //level: gameManager
    };
}(jQuery));