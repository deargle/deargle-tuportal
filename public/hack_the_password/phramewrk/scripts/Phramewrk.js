var Phramewrk = Class.extend({
    init: function(options) {
        this.options = $.extend(true, {
        }, options || {});
    },

    scrollToTopOfElement: function(element, callback) {
        $('html,body').animate(
            {
                scrollTop: $(element).offset().top - 18
            },
            'slow',
            function() {
                if(callback) {
                    callback();
                }
            }
        );
    }
});
var phramewrk = new Phramewrk();

var Dialog = Class.extend({
    init: function(options) {
        // Update the options object
        this.options = $.extend(true, {
            'ajax': false,
            'class': false,
            'header': false,
            'content': false,
            'footer': false,
            'modal': true,
            'modalOverlay': true,
            'modalOverlayClass': false,
            'closeButton': false,
            'closeOnModalOverlayClick': true,
            'closeOnEscapeKey': true,
            'onAfterShow': false,
            'onBeforeShow': false,
            'onAfterClose': false,
            'onBeforeClose': false,
            'reloadOnClose': false
        }, options || {});

        // Set the window as a jQuery object
        this.window = $(window);

        // Ajax variable (used to cancel it)
        this.ajax = null;

        // Create the dialog
        this.create();
    },

    create: function() {
        var self = this;

        // Create a transparent layer
        if(this.options.modalOverlay) {
            this.modalOverlay = $('<div class="phramewrkDialogModalOverlay"></div>');
        }
        // Add any custom overlay classes
        if(this.options['modalOverlayClass'] !== false) {
            this.modalOverlay.addClass(this.options['modalOverlayClass']);
        }

        // Create the dialog wrapper
        this.dialogWrapper = $('\
            <div style="display: none;" class="phramewrkDialogWrapper">\
                <div class="phramewrkDialog">\
                </div>\
            </div>\
        ');

        // Set the dialog div element
        this.dialog = this.dialogWrapper.find('.phramewrkDialog');

        // Add the header
        if(this.options.header !== false) {
            this.dialog.append($('<div class="phramewrkDialogHeader">'+this.options.header+'<span class="closeButton"><span></div>'));
        }

        // Add the content and set it
        this.dialog.append($('<div class="phramewrkDialogContent"></div>'));
        this.dialogContent = this.dialog.find('.phramewrkDialogContent');
        if(this.options.ajax == false) {
            this.setContent(this.options.content);
        }        

        // Add the footer
        if(this.options.footer !== false) {
            this.dialog.append($('<div class="phramewrkDialogFooter">'+this.options.footer+'<span class="closeButton">Close<span></div>'));
        }
        
        // An event listeners to the close buttons
        this.dialog.find('.closeButton').click(function(event) {
            self.destroy();
        });

        // Add any custom classes
        if(this.options['class'] !== false) {
            this.dialogWrapper.addClass(this.options['class']);
        }

        // Add the dialog to the end of the body
        if(this.options.modalOverlay) {
            $('body').children().last().after(this.modalOverlay);
        }
        $('body').children().last().after(this.dialogWrapper);

        // Position the dialog absolutely
        this.dialog.css({'position':'absolute'});

        // TODO: Listen to the size of the modal changing and reposition

        // Show the dialog
        this.show();

        // Load any AJAX content
        if(this.options.ajax !== false) {
        this.loadAjaxContent();
        }
    },

    loadAjaxContent: function() {
        this.dialogContent.html('<img src="/phramewrk/images/dialog/ajax-loader.gif" alt="Loading..." />');

        var self = this;
        // The call back function for the AJAX request
        this.options.ajax.success = function(data) {
            self.setContent(data);
            if(self.options.ajax.onSuccess && typeof(self.options.ajax.onSuccess) == 'function') {
                self.options.ajax.onSuccess();
            }
        }
        this.ajax = $.ajax(this.options.ajax);
    },

    setContent: function(content) {
        this.dialog.css({'left': '-99999px'});
        this.dialogContent.html(content);
        this.updatePosition();
    },

    // Alias for destroy
    close: function(options) {
        return this.destroy(options);
    },

    destroy: function(options) {
        // Run onBeforeClose if set
        if(this.options && this.options.onBeforeClose) {
            this.options.onBeforeClose();
        }

        // Optionally reload the page on close
        if(this.options && this.options.reloadOnClose) {
            document.location.reload(true);
            return this;
        }

        this.dialogWrapper.remove();
        if(this.options.modalOverlay) {
            this.modalOverlay.remove();
        }

        if(this.options.closeOnEscapeKey) {
            $(window).unbind('keyup');
        }

        // Cancel any ajax requests
        if(this.ajax) {
            this.ajax.abort();
        }

        // Run onAfterClose if set
        if(this.options && this.options.onAfterClose) {
            this.options.onAfterClose();
        }

        // Run a callback if set in passed options
        if(options && options.onSuccess) {
            options.onSuccess();
        }

        return this;
    },

    show: function() {
        var self = this;

        // Run onBeforeShow if set
        if(this.options && this.options.onBeforeShow) {
            this.options.onBeforeShow();
        }

        // Set an event listener to destroy the dialog on a click that occurs outside of the dialog
        if(this.options.closeOnModalOverlayClick) {
            // If they click away from the dialog (on the dialog wrapper), remove it
            this.dialogWrapper.click(function(event) {
                //console.log('Click on ' + $(event.target).attr('class'));
                if($(event.target).attr('class') == self.dialogWrapper.attr('class')) {
                    self.destroy();
                }
            });

            // If they click away from the dialog (on the dialog transparency), remove it
            if(this.options.modalOverlay) {
                this.modalOverlay.click(function(event) {
                    //console.log('Click on ' + $(event.target).attr('class'));
                    if($(event.target).attr('class') == self.modalOverlay.attr('class')) {
                        self.destroy();
                    }
                });
            }
        }

        // Add an event listener for the escape key
        if(this.options.closeOnEscapeKey) {
            $(window).keyup(function(event) {
                if(event.keyCode == 27) {
                    self.destroy();   
                }
            });
        }

        // Add the onclick event for the Okay button
        //this.dialogWrapper.find('button').click(function(event) {
        //    self.destroy();
        //});

        // Show the wrapper
        this.dialogWrapper.show();

        // Add window resize and scroll events
        this.window.resize(function(event) {
            self.updatePosition();
        });

        // Set the initial position
        this.updatePosition();

        // Run onAfterShow if set
        if(this.options && this.options.onAfterShow) {
            this.options.onAfterShow();
        }
    },

    updatePosition: function() {
        var self = this;

        this.dialog.css({'left': self.getLeftMargin()});
        this.dialog.css({'top': self.getTopMargin()});
        if(this.options.modalOverlay) {
            this.modalOverlay.width(self.window.width()).height($(document).height());
        }
    },

    resizeToContent: function() {
        
    },

    getLeftMargin: function() {
        return (this.window.width() / 2) - (this.dialog.outerWidth() * .5);
    },

    getTopMargin: function() {
        // Move the top margin to 25% from the top of the window
        var topMargin = (this.window.height() / 3) - (this.dialog.height() / 2) + this.window.scrollTop();
        return topMargin > 0 ? topMargin : 0;
    }
});