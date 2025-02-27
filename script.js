document.addEventListener('DOMContentLoaded', function() {
    // Simulated data sources - in a real application, these would come from various APIs
    const archiveSources = [
        { id: 1, name: 'National Archives', icon: 'fa-landmark' },
        { id: 2, name: 'Public Library', icon: 'fa-book' },
        { id: 3, name: 'Historical Society', icon: 'fa-scroll' },
        { id: 4, name: 'University Collection', icon: 'fa-university' },
        { id: 5, name: 'Media Archive', icon: 'fa-photo-film' }
    ];

    // Simulated categories
    const categories = [
        { id: 1, name: 'Documents' },
        { id: 2, name: 'Photos' },
        { id: 3, name: 'Videos' },
        { id: 4, name: 'Audio' },
        { id: 5, name: 'Maps' },
        { id: 6, name: 'Artifacts' }
    ];

    // Simulated archive items
    const allArchiveItems = generateSampleItems(50);

    // State management
    let state = {
        items: allArchiveItems,
        filteredItems: [],
        currentPage: 1,
        itemsPerPage: 12,
        totalPages: 1,
        viewMode: 'grid', // 'grid' or 'list'
        activeSource: null,
        activeCategories: [],
        dateFrom: null,
        dateTo: null,
        searchQuery: '',
        sortBy: 'date-desc'
    };

    // Initial setup
    initSidebar();
    updateUI();

    // Event listeners
    document.getElementById('grid-view').addEventListener('click', setGridView);
    document.getElementById('list-view').addEventListener('click', setListView);
    document.getElementById('sort-select').addEventListener('change', handleSortChange);
    document.getElementById('prev-page').addEventListener('click', goToPrevPage);
    document.getElementById('next-page').addEventListener('click', goToNextPage);
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    // Close modal when clicking on the X or outside the modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('item-modal')) {
            closeModal();
        }
    });

    // Initialize sidebar
    function initSidebar() {
        // Populate archive sources
        const sourcesContainer = document.getElementById('archive-sources');
        let sourcesHTML = '<li data-id="all" class="active">All Sources</li>';
        
        archiveSources.forEach(source => {
            sourcesHTML += `<li data-id="${source.id}"><i class="fas ${source.icon}"></i> ${source.name}</li>`;
        });
        
        sourcesContainer.innerHTML = sourcesHTML;
        
        // Add event listeners to sources
        sourcesContainer.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('#archive-sources li').forEach(li => li.classList.remove('active'));
                this.classList.add('active');
                
                const sourceId = this.getAttribute('data-id');
                state.activeSource = sourceId === 'all' ? null : parseInt(sourceId);
                state.currentPage = 1;
                
                filterItems();
                updateUI();
            });
        });
        
        // Populate categories
        const categoriesContainer = document.getElementById('categories-filter');
        let categoriesHTML = '';
        
        categories.forEach(category => {
            categoriesHTML += `
                <div class="category-checkbox">
                    <input type="checkbox" id="category-${category.id}" value="${category.id}">
                    <label for="category-${category.id}">${category.name}</label>
                </div>
            `;
        });
        
        categoriesContainer.innerHTML = categoriesHTML;
    }

    // Update the UI based on current state
    function updateUI() {
        filterItems();
        updatePagination();
        renderItems();
    }

    // Filter items based on current filters
    function filterItems() {
        state.filteredItems = state.items.filter(item => {
            // Filter by source
            if (state.activeSource && item.source.id !== state.activeSource) {
                return false;
            }
            
            // Filter by categories
            if (state.activeCategories.length > 0 && 
                !state.activeCategories.includes(item.category.id)) {
                return false;
            }
            
            // Filter by date range
            if (state.dateFrom) {
                const itemDate = new Date(item.date);
                const fromDate = new Date(state.dateFrom);
                if (itemDate < fromDate) return false;
            }
            
            if (state.dateTo) {
                const itemDate = new Date(item.date);
                const toDate = new Date(state.dateTo);
                if (itemDate > toDate) return false;
            }
            
            // Filter by search query
            if (state.searchQuery) {
                const query = state.searchQuery.toLowerCase();
                return (
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.source.name.toLowerCase().includes(query) ||
                    item.category.name.toLowerCase().includes(query)
                );
            }
            
            return true;
        });
        
        // Sort the filtered items
        sortItems();
        
        // Update total pages
        state.totalPages = Math.ceil(state.filteredItems.length / state.itemsPerPage);
        
        // Adjust current page if needed
        if (state.currentPage > state.totalPages) {
            state.currentPage = Math.max(1, state.totalPages);
        }
    }

    // Sort items based on current sort option
    function sortItems() {
        state.filteredItems.sort((a, b) => {
            switch(state.sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'name-asc':
                    return a.title.localeCompare(b.title);
                case 'name-desc':
                    return b.title.localeCompare(a.title);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });
    }

    // Render archive items
    function renderItems() {
        const container = document.getElementById('archive-items');
        
        // Apply view mode class
        container.className = `archive-items ${state.viewMode}-view`;
        
        // Calculate items to display on current page
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const itemsToDisplay = state.filteredItems.slice(startIndex, endIndex);
        
        if (itemsToDisplay.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No items found</h3>
                    <p>Try adjusting your filters or search criteria</p>
                </div>
            `;
            return;
        }
        
        let itemsHTML = '';
        
        itemsToDisplay.forEach(item => {
            const dateFormatted = new Date(item.date).toLocaleDateString();
            
            itemsHTML += `
                <div class="item" data-id="${item.id}">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="item-content">
                        <h3 class="item-title">${item.title}</h3>
                        <p>${item.description.substring(0, 80)}${item.description.length > 80 ? '...' : ''}</p>
                        <div class="item-info">
                            <span>${dateFormatted}</span>
                            <span class="item-source">${item.source.name}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = itemsHTML;
        
        // Add event listeners to items
        container.querySelectorAll('.item').forEach(item => {
            item.addEventListener('click', function() {
                const itemId = parseInt(this.getAttribute('data-id'));
                openItemModal(itemId);
            });
        });
    }

    // Update pagination controls
    function updatePagination() {
        document.getElementById('page-indicator').textContent = `Page ${state.currentPage} of ${state.totalPages || 1}`;
        document.getElementById('prev-page').disabled = state.currentPage <= 1;
        document.getElementById('next-page').disabled = state.currentPage >= state.totalPages;
    }

    // Open item modal with details
    function openItemModal(itemId) {
        const item = state.items.find(i => i.id === itemId);
        if (!item) return;
        
        const dateFormatted = new Date(item.date).toLocaleDateString();
        
        const modalContent = document.getElementById('modal-item-content');
        modalContent.innerHTML = `
            <div class="modal-item-header">
                <div class="modal-item-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="modal-item-info">
                    <h2 class="modal-item-title">${item.title}</h2>
                    <div class="modal-item-metadata">
                        <div class="metadata-item">
                            <span class="metadata-label">Date</span>
                            <span class="metadata-value">${dateFormatted}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Category</span>
                            <span class="metadata-value">${item.category.name}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">ID</span>
                            <span class="metadata-value">${item.id}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-item-description">
                ${item.description}
            </div>
            <div class="modal-item-actions">
                <button class="action-button download-button">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="action-button share-button">
                    <i class="fas fa-share-alt"></i> Share
                </button>
                <a href="#" class="source-link" target="_blank">View in original archive</a>
            </div>
        `;
        
        // Attach event listeners to modal buttons
        modalContent.querySelector('.download-button').addEventListener('click', function() {
            alert(`Downloading: ${item.title}`);
            // In a real app, this would trigger a download
        });
        
        modalContent.querySelector('.share-button').addEventListener('click', function() {
            // In a real app, this would open a share dialog
            const shareUrl = `${window.location.origin}?item=${item.id}`;
            
            if (navigator.share) {
                navigator.share({
                    title: item.title,
                    text: item.description.substring(0, 100),
                    url: shareUrl
                }).catch(console.error);
            } else {
                prompt('Copy this link to share:', shareUrl);
            }
        });
        
        document.getElementById('item-modal').style.display = 'block';
    }

    // Close the modal
    function closeModal() {
        document.getElementById('item-modal').style.display = 'none';
    }

    // Set grid view
    function setGridView() {
        document.getElementById('grid-view').classList.add('active');
        document.getElementById('list-view').classList.remove('active');
        state.viewMode = 'grid';
        renderItems();
    }

    // Set list view
    function setListView() {
        document.getElementById('list-view').classList.add('active');
        document.getElementById('grid-view').classList.remove('active');
        state.viewMode = 'list';
        renderItems();
    }

    // Handle sort change
    function handleSortChange() {
        state.sortBy = document.getElementById('sort-select').value;
        updateUI();
    }

    // Go to previous page
    function goToPrevPage() {
        if (state.currentPage > 1) {
            state.currentPage--;
            updateUI();
            window.scrollTo(0, 0);
        }
    }

    // Go to next page
    function goToNextPage() {
        if (state.currentPage < state.totalPages) {
            state.currentPage++;
            updateUI();
            window.scrollTo(0, 0);
        }
    }

    // Handle search
    function handleSearch() {
        const query = document.getElementById('search-input').value.trim();
        state.searchQuery = query;
        state.currentPage = 1;
        updateUI();
    }

    // Apply filters
    function applyFilters() {
        // Get date filters
        state.dateFrom = document.getElementById('date-from').value;
        state.dateTo = document.getElementById('date-to').value;
        
        // Get category filters
        state.activeCategories = [];
        document.querySelectorAll('#categories-filter input[type="checkbox"]:checked').forEach(checkbox => {
            state.activeCategories.push(parseInt(checkbox.value));
        });
        
        state.currentPage = 1;
        updateUI();
    }

    // Reset filters
    function resetFilters() {
        // Reset date inputs
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        
        // Uncheck all category checkboxes
        document.querySelectorAll('#categories-filter input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset source to "All Sources"
        document.querySelectorAll('#archive-sources li').forEach(li => li.classList.remove('active'));
        document.querySelector('#archive-sources li[data-id="all"]').classList.add('active');
        
        // Reset search
        document.getElementById('search-input').value = '';
        
        // Reset state
        state.dateFrom = null;
        state.dateTo = null;
        state.activeCategories = [];
        state.activeSource = null;
        state.searchQuery = '';
        state.currentPage = 1;
        
        updateUI();
    }

    // Generate sample items
    function generateSampleItems(count) {
        const items = [];
        const imageThemes = ['nature', 'city', 'history', 'people', 'technology', 'art'];
        
        for (let i = 1; i <= count; i++) {
            const sourceIndex = Math.floor(Math.random() * archiveSources.length);
            const categoryIndex = Math.floor(Math.random() * categories.length);
            const theme = imageThemes[Math.floor(Math.random() * imageThemes.length)];
            const width = 500 + Math.floor(Math.random() * 500);
            const height = 300 + Math.floor(Math.random() * 300);
            
            // Generate a random date between 1900 and 2020
            const year = 1900 + Math.floor(Math.random() * 121);
            const month = Math.floor(Math.random() * 12);
            const day = 1 + Math.floor(Math.random() * 28);
            
            items.push({
                id: i,
                title: `Archive Item ${i}`,
                description: `This is a detailed description of archive item ${i}. It contains important historical information that has been preserved for future generations. The item was carefully digitized and cataloged to make it accessible to researchers and the general public. ${loremIpsum(2)}`,
                image: `https://picsum.photos/seed/archive${i}${theme}/${width}/${height}`,
                date: new Date(year, month, day).toISOString().split('T')[0],
                source: archiveSources[sourceIndex],
                category: categories[categoryIndex],
                metadata: {
                    format: ['PDF', 'JPEG', 'MP3', 'MP4', 'TXT'][Math.floor(Math.random() * 5)],
                    size: `${(Math.random() * 20 + 1).toFixed(1)} MB`,
                    resolution: `${width}x${height}`,
                    language: ['English', 'Spanish', 'French', 'German', 'Italian'][Math.floor(Math.random() * 5)]
                }
            });
        }
        
        return items;
    }

    // Helper function to generate Lorem Ipsum text
    function loremIpsum(paragraphs = 1) {
        const loremText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget mauris sed nisi luctus auctor. Duis porttitor, quam vel mattis pellentesque, nibh neque volutpat nulla, ut tempor enim elit in velit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Sed euismod justo ac nisl dapibus, at condimentum orci hendrerit. Phasellus eget justo sem. Donec dictum, nisl at auctor aliquam, sem turpis pharetra neque, vitae rhoncus sapien justo eget purus.`;
        
        let result = '';
        
        for (let i = 0; i < paragraphs; i++) {
            result += `<p>${loremText}</p>`;
        }
        
        return result;
    }

    // Check if URL has item parameter to open a specific item
    function checkUrlForItem() {
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('item');
        
        if (itemId) {
            const id = parseInt(itemId);
            if (!isNaN(id)) {
                openItemModal(id);
            }
        }
    }

    // Check URL on initial load
    checkUrlForItem();

    // Add ability to navigate back when modal is closed
    window.addEventListener('popstate', function(event) {
        if (document.getElementById('item-modal').style.display === 'block') {
            closeModal();
        }
    });

    // Additional functionality: Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('item-modal').style.display === 'block') {
            closeModal();
        }
        
        if (e.key === 'ArrowLeft' && !document.getElementById('prev-page').disabled) {
            goToPrevPage();
        }
        
        if (e.key === 'ArrowRight' && !document.getElementById('next-page').disabled) {
            goToNextPage();
        }
    });

    // Advanced feature: Save user preferences to localStorage
    function saveUserPreferences() {
        const preferences = {
            viewMode: state.viewMode,
            itemsPerPage: state.itemsPerPage,
            sortBy: state.sortBy
        };
        
        localStorage.setItem('archivePreferences', JSON.stringify(preferences));
    }

    function loadUserPreferences() {
        const savedPreferences = localStorage.getItem('archivePreferences');
        
        if (savedPreferences) {
            const preferences = JSON.parse(savedPreferences);
            
            if (preferences.viewMode) {
                state.viewMode = preferences.viewMode;
                if (state.viewMode === 'grid') {
                    setGridView();
                } else {
                    setListView();
                }
            }
            
            if (preferences.itemsPerPage) {
                state.itemsPerPage = preferences.itemsPerPage;
            }
            
            if (preferences.sortBy) {
                state.sortBy = preferences.sortBy;
                document.getElementById('sort-select').value = state.sortBy;
            }
        }
    }

    // Load preferences on startup
    loadUserPreferences();

    // Save preferences when they change
    document.getElementById('sort-select').addEventListener('change', saveUserPreferences);
    document.getElementById('grid-view').addEventListener('click', saveUserPreferences);
    document.getElementById('list-view').addEventListener('click', saveUserPreferences);
});
