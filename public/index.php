<?php
require join(DIRECTORY_SEPARATOR, array('.','..','vendor','autoload.php'));

/**
 * Identify the four treatments... 
 * 0 => control
 * 1 => staticText
 * 2 => dynamicText
 * 3 => strengthMeter
 * x => dynamicTextAndStrengthMeter <= but this one was not included in the HICSS analysis
 */
function get_treatment() {
    $treatment = null;
    
    switch(rand(0,3)) {
        case 0:
            $treatment = 'control';
            break;
        case 1:
            $treatment = 'staticText';
            break;
        case 2:
            $treatment = 'dynamicText';
            break;
        case 3:
            $treatment = 'strengthMeter';
            break;
    }
    
    return $treatment;
}

$allowed_treatments = array('control','staticText','dynamicText','strengthMeter');

function get_cookie_domain() {
    $cookie_domain = null;

    $domain = $_SERVER['HTTP_HOST'];

    if (strpos($_SERVER['HTTP_HOST'],'byu.edu') !== false) {
        $cookie_domain = '.byu.edu';
    } else {
        $cookie_domain = $domain;
    }
    
    return $cookie_domain;
}

# Session cookie management
$cookie_domain = get_cookie_domain();
session_cache_limiter(false);
session_set_cookie_params(60*45,'/', $cookie_domain, false, false);
session_start();

if (!isset($_SESSION['treatment'])){
    $_SESSION['treatment'] = get_treatment();
}

$app = new \Slim\Slim(array(
    'templates.path' => join(DIRECTORY_SEPARATOR,array('.','..','templates')),
    'view' => new \Slim\Views\Twig(),
    'mode' => 'development',
    'study.treatment' => $_SESSION['treatment']
));

$app->configureMode('development', function() use ($app) {
    $app->config(array(
        'links.to-cas' => '/cas',
        'links.after-cas' => '/instructions'
        ));
});

$app->configureMode('production', function() use ($app){
    $app->config(array(
        'links.to-cas' => 'http://cas.byu.edu/cas',
        'links.after-cas' => 'http://behaviorallab.byu.edu/instructions'
    ));
});

$app->group('/api', function() use ($app) {
    
    $app->get('/getTip/password/:password/tipType/:tipType', function($password, $tipType) use ($app) {
        $url = "http://security.byu.edu/password-api.php?password={$password}&tipType={$tipType}";

        $ch = curl_init($url);

        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

        $response = curl_exec($ch);
        curl_close($ch);

        $app->response->headers->set('Content-Type', 'application/json');

        $response_array = json_decode($response, true);

        $morphed_response = array('status'=>'success', 'response'=>$response_array);

        echo json_encode($morphed_response);
    });
    
});

$app->group('/cas', function() use ($app, $allowed_treatments) {
    
    $app->map('/', function() use ($app) {
        
        $app->render('cas/sign-in.html');
        
    })->via('GET','POST');

    $app->map('/update(/:treatment)', function($treatment = null) use ($app, $allowed_treatments) {
        
        // if it is passed in, override the randomly-set treatment. For testing
        if ($treatment && !in_array($treatment, $allowed_treatments)){
            $app->halt(500,'Treatment not in allowed list: ' . join(', ', $allowed_treatments));
        }
            
        if (!$treatment) {
            $treatment = $app->config('study.treatment');
        }
        
        $is_interactive_treatment = in_array($treatment, array('dynamicText', 'strengthMeter'));
        
        $data = array(
            'link' => $app->config('links.after-cas'),
            'treatment' => array( 
                'type' => $treatment,
                'is_interactive' => $is_interactive_treatment
                ),
        );
        
        $app->render('cas/update.html', $data);
        
    })->via('GET','POST');
    
});

$app->get('/', function() use ($app) {
    $app->render('index.html', array(
        'link' => $app->config('links.to-cas'),
        'treatment' => $app->config('study.treatment')
            ));
});

$app->map('/instructions', function() use ($app){
    $app->render('instructions.html', array());
})->via('GET','POST');


$app->run();

?>
