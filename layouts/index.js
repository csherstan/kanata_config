// Keyboard Layouts Manifest
(function() {
    // Initialize global registry
    window.KEYBOARD_LAYOUTS = {};

    // Define layouts to load
    const layoutFiles = [
        'ansi-60.js',
        'ansi-tkl.js',
        'ansi-full.js',
        'kinesis-freestyle.js'
    ];

    // Track loading state
    window.LAYOUTS_LOADING = {
        total: layoutFiles.length,
        loaded: 0,
        callbacks: []
    };

    // Function to call when all layouts loaded
    window.onAllLayoutsLoaded = function(callback) {
        if (window.LAYOUTS_LOADING.loaded >= window.LAYOUTS_LOADING.total) {
            callback();
        } else {
            window.LAYOUTS_LOADING.callbacks.push(callback);
        }
    };

    // Load each layout file
    layoutFiles.forEach(function(file) {
        const script = document.createElement('script');
        script.src = 'layouts/' + file;
        script.onload = function() {
            window.LAYOUTS_LOADING.loaded++;
            if (window.LAYOUTS_LOADING.loaded >= window.LAYOUTS_LOADING.total) {
                // All loaded - trigger callbacks
                window.LAYOUTS_LOADING.callbacks.forEach(function(cb) { cb(); });
            }
        };
        script.onerror = function() {
            console.error('Failed to load layout:', file);
            window.LAYOUTS_LOADING.loaded++; // Count as loaded to avoid blocking
        };
        document.head.appendChild(script);
    });
})();
