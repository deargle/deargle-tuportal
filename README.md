deargle-tuportal
================

_Part of the Interactive Fear Appeals project_


## _Notes to Tony, October 2019_

https://deargle-tuportal.herokuapp.com

will take you to a landing page. Submit anything, and you'll get to

https://deargle-tuportal.herokuapp.com/update

As before, you can specify a specific treatment with an extra url paramter, e.g.,

https://deargle-tuportal.herokuapp.com/update/foobar

The strength scores are a function of the magnitude of the number of guesses to crack. I used zxcvn's thresholds for their [0,4] score that they provide for strength meters. The scores 0-4 correspond to order of magnitude guess thresholds of:

        result.score      # Integer from 0-4 (useful for implementing a strength bar)

        0 # too guessable: risky password. (guesses < 10^3)

        1 # very guessable: protection from throttled online attacks. (guesses < 10^6)

        2 # somewhat guessable: protection from unthrottled online attacks. (guesses < 10^8)

        3 # safely unguessable: moderate protection from offline slow-hash scenario. (guesses < 10^10)

        4 # very unguessable: strong protection from offline slow-hash scenario. (guesses >= 10^10)

Ours does the same. The meter (and the dynamic text) have 5 levels:

To shoehorn in the zxcvbn thresholds into our system, I
(1) calculate the zxcvbn threshold, and then
(2) multiply it by 20. That becomes the "strengthIndex"

Do not forget that the underlying password-scoring api may need some time to warm up! Check whether it is online by visiting https://password-api.herokuapp.com/?action=getServiceStatus -- if it says "online", it's up. If it is not online, then all of your strength estimates on my fake temple portal pages, socwall pages, or byu cas pages will be an estimate of 0 seconds to crack. _That's a problem._ Just now I set the password api to never go to sleep, but unsure whether it will actually work because the app is currently over-consuming memory because it loads the dictionaries into memory and heroku might kill it out of hand. So check the status before each focus group.
