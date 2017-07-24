<?php

namespace BAM\WebsaverBundle\Controller\Contests;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use BAM\WebsaverBundle\Entity\WsGameContest;

class GameController extends Controller {

    var $imagesCollection;
    var $nbLevels;
    var $nbShelves;
    var $userID;
    var $levels;
    var $allowedPerDay = 5;

    public function indexAction() {

        $user = $this->get('security.context')->getToken()->getUser();
        if ($user == 'anon.') {
            return $this->redirect($this->generateUrl('_contests_login'));
        }
        $this->userID = $user->getId();
        return $this->render('BAMWebsaverBundle:Contests\Contest:game.html.twig');
    }

    public function instructionAction() {
        return $this->render('BAMWebsaverBundle:Contests\Contest:instruction.html.twig');
    }

    public function ajaxAction(Request $request) {
        $response = new Response();
        $user = $this->get('security.context')->getToken()->getUser();
        if ($user == 'anon.') {
            $response->setStatusCode(401);
        } else {
            $this->userID = $user->getId();
            if ($request->isMethod('POST')) {
                //Game over
                $score = $request->request->get('score');
                $levelAchieved = $request->request->get('levelAchieved');
                $sharedFb = $request->request->get('sharedFb');
                $token = $request->request->get('token');
                $db = $this->dbGameOver($token, $score, $levelAchieved, $sharedFb);
                $response->setContent(json_encode(array('play' => $db, 'data_sent' => array("score" => $score, "tk" => $token))));
            } else {
                // Starting the game
                if (is_null($request->query->get('nbShelves'))) {
                    $response->setStatusCode(401);
                } else {
                    $optinTimestamp = $request->query->get('ws_optin');
                    $play = $this->userIsAllowed();
                    $token = "";
                    if ($play["run"] <= $this->allowedPerDay - 1) {
                        $token = $this->dbGameStart($optinTimestamp);
                    } else {
                        $play["auth"] = "none"; //No sharing to get 3 more lives
                    }

                    $this->nbShelves = $request->query->get('nbShelves');
                    $this->levels = $this->generateLevels();

                    $this->setItemsHTMLClasses();
                    $response->setContent(json_encode(array("img" => $this->imagesCollection, "tk" => $token, 'levels' => $this->levels, 'play' => $play)));
                }
            }
        }
//        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost');
        $response->headers->set('Content-Type', 'application/json');
        return $response;
    }

    public function gameoverAction(Request $request) {

        $token = $request->query->get('t');
        if (!isset($token)) {
            throw $this->createNotFoundException('The page does not exist');
        }

        $em = $this->getDoctrine()->getManager();
        $entry = $em->getRepository('BAMWebsaverBundle:WsGameContest')->findOneBy(array("token" => $token));
        if (!isset($entry)) {
            throw $this->createNotFoundException('The page does not exist');
        }

        return $this->render('BAMWebsaverBundle:Contests\Contest:gameover.html.twig', array('score' => $entry->getScore()));
    }

    public function winnersAction() {

        $playingDate = date("Y-m-d", getdate()[0]);

        $weeksRange = array(
            "Week_1" => ["from" => "2017-07-24 00:00:00", "to" => "2017-07-30 23:59:00"],
            "Week_2" => ["from" => "2017-07-31 00:00:00", "to" => "2017-08-06 23:59:00"],
            "Week_3" => ["from" => "2017-08-07 00:00:00", "to" => "2017-08-13 23:59:00"],
            "Week_4" => ["from" => "2017-08-14 00:00:00", "to" => "2017-08-20 23:59:00"],
            "Week_5" => ["from" => "2017-08-21 00:00:00", "to" => "2017-08-27 23:59:00"],
        );

        function check_in_range($start_date, $end_date, $date_from_user) {
            // Convert to timestamp
            $start_ts = strtotime($start_date);
            $end_ts = strtotime($end_date);
            $user_ts = strtotime($date_from_user);

            // Check that user date is between start & end
            return (($user_ts >= $start_ts) && ($user_ts <= $end_ts));
        }

        function weekRange($weeksRange, $playingDate) {
            foreach ($weeksRange as $key => $date) {
                $range = check_in_range($date["from"], $date["to"], $playingDate);
                if ($range) {
                    return $key;
                }
            }
        }

        $range = weekRange($weeksRange, $playingDate);

        $topFive = $this->getWinnerList($weeksRange[$range]["from"], $weeksRange[$range]["to"]);

        $winners = array();
        foreach ($weeksRange as $key => $date) {
            if (strtotime($playingDate) > strtotime($date["to"])) {
                $data = $this->getWeekWinner($date["from"], $date["to"]);
                if (!empty($data)) {
                    $winners[$key] = $data;
                }
            }
        }

        return $this->render('BAMWebsaverBundle:Contests\Contest:winners.html.twig', array('topScores' => $topFive, 'winners' => $winners));
    }

    private function sec_to_time($seconds) {
        $minutes = floor($seconds % 3600 / 60);
        $seconds = $seconds % 60;

        return sprintf("%02d min %02d sec", $minutes, $seconds);
    }

    //Return void
    private function setImages() {
        $images = array(
            array(
                "src" => "bananas.png",
                "win_level" => [3, 4, 19, 38, 44]
            ),
            array(
                "src" => "bell_pepper.png",
                "win_level" => [2, 4, 19]
            ),
            array(
                "src" => "bokchoy.png",
                "win_level" => [7, 10, 37]
            ),
            array(
                "src" => "boloni.png",
                "win_level" => [1, 8, 31, 44]
            ),
            array(
                "src" => "bread.png",
                "win_level" => [1, 6, 9, 12]
            ),
            array(
                "src" => "brie.png",
                "win_level" => [4, 7, 10, 19, 29]
            ),
            array(
                "src" => "brocoli.png",
                "win_level" => [2, 12, 30, 38]
            ),
            array(
                "src" => "cans.png",
                "win_level" => [2, 7, 21, 37, 44]
            ),
            array(
                "src" => "carrot.png",
                "win_level" => [8, 10, 12, 39]
            ),
            array(
                "src" => "celeri.png",
                "win_level" => [5, 12, 19, 45]
            ),
            array(
                "src" => "cheese.png",
                "win_level" => [12, 21, 29]
            ),
            array(
                "src" => "cherries.png",
                "win_level" => [21, 19, 29]
            ),
            array(
                "src" => "chicken.png",
                "win_level" => [30, 23, 39, 44]
            ),
            array(
                "src" => "chips.png",
                "win_level" => [2, 19, 29, 45]
            ),
            array(
                "src" => "chocolate.png",
                "win_level" => [1, 4, 12, 29]
            ),
            array(
                "src" => "coconut.png",
                "win_level" => [4, 7, 10, 12, 14]
            ),
            array(
                "src" => "corn.png",
                "win_level" => [13, 23, 37, 44]
            ),
            array(
                "src" => "cucumber.png",
                "win_level" => [1, 10, 14, 28]
            ),
            array(
                "src" => "donut.png",
                "win_level" => [5, 12, 21, 29]
            ),
            array(
                "src" => "eggplant.png",
                "win_level" => [14, 23, 36, 45]
            ),
            array(
                "src" => "eggs.png",
                "win_level" => [10, 28, 31]
            ),
            array(
                "src" => "fish.png",
                "win_level" => [21, 31, 39, 45]
            ),
            array(
                "src" => "fudgesicle.png",
                "win_level" => [21, 28, 39]
            ),
            array(
                "src" => "grapes.png",
                "win_level" => [5, 23, 31]
            ),
            array(
                "src" => "green_apple.png",
                "win_level" => [14, 28, 44]
            ),
            array(
                "src" => "jam.png",
                "win_level" => [14, 28, 36]
            ),
            array(
                "src" => "kiwi.png",
                "win_level" => [27, 31, 39]
            ),
            array(
                "src" => "lemon.png",
                "win_level" => [14, 27, 40]
            ),
            array(
                "src" => "lettuce.png",
                "win_level" => [2, 27, 35, 45]
            ),
            array(
                "src" => "milk.png",
                "win_level" => [14, 27, 32, 44]
            ),
            array(
                "src" => "mushroom.png",
                "win_level" => [27, 32, 40]
            ),
            array(
                "src" => "onion.png",
                "win_level" => [11, 26, 35, 43]
            ),
            array(
                "src" => "orange.png",
                "win_level" => [26, 32, 36, 40]
            ),
            array(
                "src" => "orange_juice.png",
                "win_level" => [2, 11, 26, 45]
            ),
            array(
                "src" => "packets.png",
                "win_level" => [14, 26, 36, 40]
            ),
            array(
                "src" => "peanut_butter.png",
                "win_level" => [18, 20, 32]
            ),
            array(
                "src" => "pear.png",
                "win_level" => [11, 25, 32, 35, 40]
            ),
            array(
                "src" => "peas.png",
                "win_level" => [9, 18, 34, 43]
            ),
            array(
                "src" => "pepper.png",
                "win_level" => [14, 32, 43]
            ),
            array(
                "src" => "pineapple.png",
                "win_level" => [18, 32, 40]
            ),
            array(
                "src" => "plum.png",
                "win_level" => [11, 25, 34, 43]
            ),
            array(
                "src" => "potato.png",
                "win_level" => [14, 17, 25, 45]
            ),
            array(
                "src" => "pumpkin.png",
                "win_level" => [9, 18, 25, 42]
            ),
            array(
                "src" => "radish.png",
                "win_level" => [15, 17, 25]
            ),
            array(
                "src" => "red_apple.png",
                "win_level" => [6, 25, 40, 42]
            ),
            array(
                "src" => "salsa.png",
                "win_level" => [15, 17, 34, 45]
            ),
            array(
                "src" => "sauce.png",
                "win_level" => [24, 32, 41]
            ),
            array(
                "src" => "steak.png",
                "win_level" => [18, 20, 34]
            ),
            array(
                "src" => "strawberry.png",
                "win_level" => [9, 11, 24]
            ),
            array(
                "src" => "tomato.png",
                "win_level" => [16, 33, 41]
            ),
            array(
                "src" => "tuna.png",
                "win_level" => [11, 24, 34, 42]
            ),
            array(
                "src" => "watermelon.png",
                "win_level" => [16, 20, 24, 33]
            ),
            array(
                "src" => "wieners.png",
                "win_level" => [3, 4, 20, 22]
            ),
            array(
                "src" => "wine.png",
                "win_level" => [11, 15, 22, 24]
            ),
            array(
                "src" => "yogurt.png",
                "win_level" => [3, 11, 16, 20]
            )
        );

        $this->imagesCollection = $images;
    }

    /*
     * Organise items on the shelves, depends on how many shelves do we have and how many images
     * return Array
     */

    private function itemsOnShelves() {
        shuffle($this->imagesCollection);
        $images = $this->imagesCollection;
        $totalItems = count($images);
        $index = 0;
        for ($row = 1; $row <= $this->nbShelves; $row++) {
            $shelves[$row] = array();
            for ($items = 0; $items < round($totalItems / $this->nbShelves); $items++) {
                if (isset($images[$index])) {
                    array_push($shelves[$row], $images[$index]);
                    unset($images[$index]);
                }
                $index++;
            }
        }
        return($shelves);
    }

    /*
     * Return void
     * Set classes and ids element allowing js to generate the HTML
     */

    private function setItemsHTMLClasses() {
        $this->setImages();
        $listItems = $this->itemsOnShelves();
        $tempArray = array();
        foreach ($listItems as $key => $shelves) {
            $element = "#shelve" . $key;
            $class = "websaver_shelve" . $key;
            for ($i = 0; $i < count($shelves); $i++) {
                array_push($tempArray, array(
                    "src" => $shelves[$i]["src"],
                    "class" => $class,
                    "element" => $element,
                    "level" => $shelves[$i]["win_level"]
                ));
            }
        }

        $this->setItemsWinLevel($tempArray);
    }

    /*
     * Set html class "gotya" to find each images users should click to win on every levels
     */

    private function setItemsWinLevel($tempArray) {
        for ($l = 1; $l <= count($this->levels); $l++) {
            $levelsArray[$l] = array();
            $t = array();
            foreach ($tempArray as $images) {
                //If the images should be clicked in this level
                if (in_array($l, $images["level"])) {
                    $images["class"] = $images["class"] . " gotya";
                }
                array_push($t, $images);
            }
            $levelsArray[$l] = $t;
        }

        $this->imagesCollection = $levelsArray;
    }

    //Verify whether the user can play or not
    private function userIsAllowed($userID = null) {
        if (is_null($userID)) {
            $userID = $this->userID;
        }

        $date = new \DateTime();
        $em = $this->getDoctrine()->getManager();
        $query = $em->createQuery(
                        'SELECT count(p) as total, p.hasShared
                        FROM BAMWebsaverBundle:WsGameContest p
                        WHERE (p.date >= :from AND p.date <= :to) and p.userID = :user GROUP BY p.hasShared')
                ->setParameter('from', $date->format('Y-m-d 00:00:00'))
                ->setParameter('to', $date->format('Y-m-d 23:59:59'))
                ->setParameter('user', $userID);
        $totalPlayed = $query->getResult();

        $total = 0;
        $auth = 'all';
        if (!empty($totalPlayed)) {
            $social = 0;
            for ($i = 0; $i < count($totalPlayed); $i++) {
                $total = $total + (int) $totalPlayed[$i]['total'];
                $social = $social + (int) $totalPlayed[$i]['hasShared'];
            }

            if ($total >= $this->allowedPerDay AND $social == 0) {
                $auth = 'sharing';
            } else if ($total >= $this->allowedPerDay AND $social == 1) {
                $auth = 'none';
            } else if ($total < $this->allowedPerDay AND $social >= 1) {
                $auth = 'simple-share';
            } else {
                $auth = 'all';
            }
        }
        return array('run' => $total, 'auth' => $auth);
    }

    private function dbGameOver($token, $score, $levelAchieved, $sharedFb) {
        $em = $this->getDoctrine()->getManager();
        $game = $em->getRepository('BAMWebsaverBundle:WsGameContest')->findOneBy(array("token" => $token));
        if (!$game) {
            return array('Data can\'t be save');
        }

        $userID = $game->getUserID();

        if (isset($levelAchieved)) {
            $flag = $this->checkTimeUsed($levelAchieved);
            $game->setFlag($flag);
            $game->setLevelachieved(json_encode($levelAchieved));
        }

        $game->setDate();
        $game->setScore((int) $score);
        $game->setUpdated(1);
        $game->setHasShared($sharedFb === 'true' ? true : false);
        $em->flush();

        $return = $this->userIsAllowed($userID);
        return $return;
    }

    private function dbGameStart($optinTimestamp) {
        $ip = $_SERVER['REMOTE_ADDR'] ?: ($_SERVER['HTTP_X_FORWARDED_FOR'] ?: $_SERVER['HTTP_CLIENT_IP']);

        $token = bin2hex(random_bytes(20));
        $game = new WsGameContest();
        $game->setScore(0);
        $game->setDate();
        $game->setUserID($this->userID);
        $game->setLevelachieved(0);
        $game->setToken($token);
        $game->setUpdated(0);
        $game->setFlag(0);
        $game->setSystem($ip);
        $game->setCheckRules($optinTimestamp);

        $em = $this->getDoctrine()->getManager();
        $em->persist($game);
        $em->flush();
        return $token;
    }

    private function getWeekWinner($from, $to) {
        $em = $this->getDoctrine()->getManager();
        $connection = $em->getConnection();
        $statement = $connection->prepare('SELECT username, userID, first_name, last_name, cdate, score, levelAchieved, winner
                 FROM ws_users u, ws_game_contest c
                 WHERE c.userID = u.id
                 AND (c.cdate BETWEEN ? AND ?)
                 AND c.winner = 1
                 LIMIT 1');
        $statement->bindValue(1, $from, \PDO::PARAM_STR);
        $statement->bindValue(2, $to, \PDO::PARAM_STR);
        $statement->execute();
        $winners = $statement->fetch();
        if (!empty($winners)) {

            $winners = array(
                "fullname" => $winners['first_name'] . ' ' . $winners['last_name'],
                "email" => $winners['username'],
                "date" => $winners['cdate'],
                "score" => $winners['score']
            );

            return $winners;
        } else {
            // Assign a winner
            $weekBestScore = $this->getWinnerList($from, $to, 1);
            if (!empty($weekBestScore)) {
                $this->setWinner($weekBestScore[0]["id"]);
                return $this->getWeekWinner($from, $to);
            }
            return $weekBestScore;
        }
    }

    //Return an object of users IDs
    private function getWinnerList($from, $to, $nbWinners = 5) {
        $em = $this->getDoctrine()->getManager();
        $connection = $em->getConnection();
        $statement = $connection->prepare('SELECT winners.id as contestID, username, userID, first_name, last_name, cdate, score, levelAchieved
                 FROM ws_users u 
                 RIGHT JOIN (SELECT * FROM ws_game_contest a WHERE a.score = (
                            SELECT MAX(b.score) FROM ws_game_contest b
                            WHERE a.userID = b.userID AND b.updated = 1 AND b.flag = 0 AND b.winner = 0
                            AND (b.cdate BETWEEN ? AND ?))
                     AND a.updated = 1 GROUP BY a.userID ORDER BY a.score DESC) as winners 
                 ON u.id = winners.userID limit ?');
        $statement->bindValue(3, (int) $nbWinners, \PDO::PARAM_INT);
        $statement->bindValue(1, $from, \PDO::PARAM_STR);
        $statement->bindValue(2, $to, \PDO::PARAM_STR);
        $statement->execute();
        $winners = $statement->fetchAll();

        if (!empty($winners)) {
            for ($i = 0; $i < count($winners); $i++) {
                $winners[$i]['levelAchieved'] = json_decode($winners[$i]['levelAchieved']);
            }

            for ($i = 0; $i < count($winners); $i++) {
                $time = $bonus = 0;
                $level = count($winners[$i]['levelAchieved']);
                for ($j = 0; $j < $level; $j++) {
                    $w = (array) $winners[$i]['levelAchieved'][$j];
                    if (!empty($w)) {
                        $time = $time + (int) $w['Time'];
                        $bonus = $bonus + (int) $w['Bonus'];
                    }
                }
                $winners[$i] = array(
                    "id" => $winners[$i]['contestID'],
                    "fullname" => $winners[$i]['first_name'] . ' ' . $winners[$i]['last_name'],
                    "email" => $winners[$i]['username'],
                    "date" => $winners[$i]['cdate'],
                    "score" => $winners[$i]['score'],
                    "time" => $this->sec_to_time($time),
                    "bonus" => $bonus,
                    "level" => $level
                );
            }
            return $winners;
        }
        return array();
    }

    //Set a winner
    private function setWinner($contestID) {
        $em = $this->getDoctrine()->getManager();
        $game = $em->getRepository('BAMWebsaverBundle:WsGameContest')->findOneBy(array("id" => $contestID));

        $game->setWinner(1);
        $game->setWinDate();

        $em->flush();
    }

    // Generate game levels. It will also being used in back-end to make sure the user didn't stop the script
    private function generateLevels() {
        $timer = 30;
        $speed = 1050;
        $j = 5;
        for ($i = 1; $i <= 45; $i++) {
            $obj = array(
                'speed' => (int) $speed,
                'timer' => (int) $timer,
                'text' => (string) $i
            );
            //do not use push. Need this array to start with index 1 (as the level)
            $level[$i] = $obj;
            if ($timer > 10) {
                $timer = round($timer - (($timer * $j) / 100));
            } else {
                $j = $j + 0.5;
                $timer = round($timer - ($timer * $j / 100), 0, PHP_ROUND_HALF_DOWN);
            }
            $speed = round($speed - (($speed * 10) / 100));
        }

        return $level;
    }

    // Verify whether an user is taking more time to play that expected
    private function checkTimeUsed($LevelsAchieved) {
        $flag = false;
        for ($i = 0; $i < count($LevelsAchieved); $i++) {
            $level = (int) $LevelsAchieved[$i]['Level'];
            $time = (int) $LevelsAchieved[$i]['Time'];
            // If an user take more time to complete a level than what is allowed on each level, send a flag
            if ($this->levels[$level]['timer'] > $time) {
                $flag = true;
                break;
            }
        }
        return $flag;
    }

}
