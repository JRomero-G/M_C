// notifications.js - Sistema unificado
class NotificationSystem {
    constructor(context = 'public') {
        this.context = context;
        this.container = this.createContainer();
        this.duration = context === 'admin' ? 4000 : 3000;
    }
    
    createContainer() {
        let container = document.querySelector('.notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        return container;
    }
    
    show(message, type = 'success', options = {}) {
        const notification = document.createElement('div');
        notification.className = `carrito-notificacion ${type}`;
        
        // Diferencias según contexto
        if (this.context === 'admin') {
            notification.classList.add('persistent');
            if (options.critical) notification.classList.add('critical');
        }
        
        notification.innerHTML = `
            <i class="fas ${this.getIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Posición según contexto
        if (this.context === 'admin') {
            this.container.prepend(notification);
        } else {
            document.body.appendChild(notification);
        }
        
        // Duración según contexto
        const duration = options.duration || this.duration;
        
        if (!options.persistent) {
            setTimeout(() => this.hide(notification), duration);
        }
        
        return notification;
    }
    
    hide(notification) {
        notification.classList.add('notification-slide-out');
        setTimeout(() => notification.remove(), 300);
    }
    
    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }
}

// Inicialización según la página
document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = document.body.classList.contains('admin-area') || 
                    window.location.pathname.includes('/admin/');
    
    window.notifications = new NotificationSystem(isAdmin ? 'admin' : 'public');
});