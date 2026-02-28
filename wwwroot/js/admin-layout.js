// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Open sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scroll when sidebar is open
        });
    }

    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore body scroll
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar on window resize to desktop size
    window.addEventListener('resize', function () {
        if (window.innerWidth >= 768) {
            closeSidebar();
        }
    });

    // Highlight active link based on current page
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath && currentPath.includes(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        } else if (linkPath === '/' && currentPath === '/') {
            link.classList.add('active');
        }
    });
});

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function () {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});
