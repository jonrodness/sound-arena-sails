var orbs = [];
var orbAnimationTimer;

$(window).load(function() {

	// Alternate between top header messages
	var $headerMsg = $('#header-msg');
	var $topHeader = $('top-header');
	var messages = ['watch your videos', 'see your images', 'hear your music'];
	var messageNum = 0;
	animateMsg = function() {
		var animationName = 'animated flipInX';
		var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
		messageNum = ++messageNum % messages.length;
		$headerMsg.text(messages[messageNum]);
		$headerMsg.addClass(animationName);
		$headerMsg.one(animationEnd, function() {
			$(this).removeClass(animationName);
		});
	};

	// Decrease navbar opacity when page not scrolled to top of window
	$(window).scroll(function() {
		var $scrollTop = $(window).scrollTop();
		var $navbar = $('#navbar');

		if ($scrollTop > 0) {
			//$navbar.addClass('navbar-fixed-top');
			$navbar.addClass('navbar-transparent')
		}
		else {
			$navbar.removeClass('navbar-transparent')
			//$navbar.removeClass('navbar-fixed-top')
		}
	});

	// Increase opacity when mouse hover over navbar
	$('#navbar').hover(function() {
		var $scrollTop = $(window).scrollTop();
		if ($scrollTop != 0) {
			$(this).toggleClass('navbar-transparent');
		}
	});

	$(".menu-item").hover(function() {
		$(this).toggleClass('menu-item-selected');
	});

	// Create orbs	
	var orbNum = 1; // future: use Switch statement to reflect size (onresize)
	var windowWidth = $(window).width();

	if (windowWidth > 1500) {
		orbNum = 7;
	}

	else if (windowWidth > 750) {
		orbNum = 3;
	}

	var $orbBox = $('#orb-box');
	var orbBoxWidth = $orbBox.width();
	var orbDisplacementX = (orbBoxWidth/orbNum);
	var orbBoxHeight = $orbBox.height();
	var orbDisplacementY = (orbBoxHeight/orbNum);

	/* Orb Constructor */
	var Orb = function(number, level) {
		this.$div = $('<div></div>');
		this.number = number;
		this.level = level;
		this.nextOrbRad;
		this.nextOrbBorder;
		this.nextOrbPosX;
		this.nextOrbPosY;
		this.originalOrbStyles = {};
		this.orbAnimationTimer;
		var isNew = false;
		this.setIsNew = function(bool) {
			isNew = bool;
		}
		this.getIsNew = function() {
			return isNew;
		}
	};
	 
	

	Orb.prototype.calculateOrbPosX = function () {
		// TODO: must use percentages to get responsive 
		// var nextRelativeXPosition = 100 / orbNum * (this.number + 1);
		// return nextRelativeXPosition + "%";
		
		var pos = 0;
		pos = ((this.number * orbDisplacementX) + (orbDisplacementX / 2) 
			- (this.nextOrbRad / 2));
		return pos;
	};

	Orb.prototype.calculateOrbPosY = function() {
		var pos = 0;
		//var level = orbNum - this.number - 1;
		var slopeVar;
		if (this.level == 0) {
			slopeVar = 0;
		}
		else {
			slopeVar = orbNum / this.level;
		}
		pos = (((this.level - 1) * orbDisplacementY) + (orbDisplacementY / 2) 
				- (this.nextOrbRad  / 2)) * slopeVar;
		return pos;
	};

	Orb.prototype.calculateOrbRad = function() {
		var newRad;
		newRad = orbDisplacementY * this.level * 0.5;
		return newRad;
	};

	Orb.prototype.calculateOrbBorder = function() {
		// Temporarily removed to make 1px border

		// var newBorder;
		// newBorder = this.level;
		// return newBorder;
		return 1;
	};

	Orb.prototype.adjustOrbLevel = function() {
		if (this.number < (orbNum / 2)) {
			this.level++;
		}
		else {
			this.level--;
		}
	};

	Orb.prototype.setNextOrbAttr = function() {
		this.number++;
		this.adjustOrbLevel();
		this.nextOrbRad = this.calculateOrbRad();
		this.nextOrbPosX = this.calculateOrbPosX();
		this.nextOrbPosY = this.calculateOrbPosY();
		this.nextOrbBorder = this.calculateOrbBorder();
	};

	Orb.prototype.getNextOrbAttrs = function() {
		var attrs = {
			left: this.nextOrbPosX,
			top: this.nextOrbPosY,
			height: this.nextOrbRad,
			width: this.nextOrbRad,
			'border-radius': this.nextOrbRad,
			'border-width': this.nextOrbBorder,
		}
		return attrs;
	};

	animateOrbs = function() {
		$.each(orbs, function() {
			var nextAttrs = {
				left: this.nextOrbPosX,
				top: this.nextOrbPosY,
				height: this.nextOrbRad,
				width: this.nextOrbRad,
				'border-radius': this.nextOrbRad,
				'border-width': this.nextOrbBorder,
			}
			if (this.nextOrbPosX <= (orbBoxWidth - this.$div.width())) {
			 // may want to change xOrbPosition with a position directly obtained from $orbBox
				this.$div.animate(nextAttrs, 2000, this.setNextOrbAttr.bind(this));
			}
			else {
				// stop animation when orb reaches right edge of container
				this.$div.remove();
				orbs.pop();
				var newOrb;
				newOrb = new Orb(0, 1);
				newOrb.setIsNew(true);
				newOrb.setupOrb();
				delete this; // TODO: THERE IS A MEMORY LEAK AND THE ELEMENTS ARE NOT BEING REMOVED FROM THE DOM (USE DEV TOOLS TO SEE ELEMENTS IN DOM)
			}
		});	
	};

	animate = function() {
		animateOrbs();
		animateMsg(); 
	}

	/* Sets up orb */
	Orb.prototype.setupOrb = function() {
		this.$div.addClass('orb');
		var orbRad = this.calculateOrbRad();
		this.originalOrbStyles = {
			'border-radius': orbRad,
			'border-width': this.calculateOrbBorder(),
			height: orbRad,
			width: orbRad,
			left: ((this.number * orbDisplacementX) + (orbDisplacementX / 2) 
				- (orbRad / 2)),
			top: (((this.level - 1) * orbDisplacementY) + (orbDisplacementY / 2) 
				- (orbRad / 2)) * (orbNum / this.level),
		}; 
		this.$div.css(this.originalOrbStyles);
		var $link = $("<a href='#top'></a>");
		$link.append(this.$div);
		$orbBox.append($link);
		this.setNextOrbAttr();
		if (this.getIsNew()) {
			this.$div.css({
				'border-radius': 0,
				'border-width': 0,
				height: 0,
				width: 0,
			});
			this.setIsNew(false);
			this.$div.animate(this.originalOrbStyles, 2000);
			orbs.unshift(this);
		}
	};

	// Instantiate all orbs in this orbBox
	var i = 0;	
	for (i; i < orbNum; i++) {
		var level;
		if (i < orbNum / 2) {
			level = i + 1;
		}
		else {
			level = orbNum - i;
		}
		orbs[i] = new Orb(i, level);
		orbs[i].setupOrb();
	};

	orbAnimationTimer = setInterval(
			animate, 4000);
});

/* Navbar */

// TODO: should not reconnect every time this layout is loaded.
// Check whether socket is already listening (multiple tabs).
// Confirm only this user gets message
// Perhaps better to use consumption model with publishAdd method?

io.socket.on('user', function(oData) {
var $navbar = $(".navbar .navbar-plays");
$navbar.addClass("new-plays");
console.log(oData);
}); 

io.socket.get('/user', function(body, response) {
console.log(response);
}); 


// TODO: this needs to persist - it doesn't if page is refreshed
markSeen = function() {
    var $navbar = $(".navbar .navbar-plays");
    $navbar.removeClass("new-plays");
};