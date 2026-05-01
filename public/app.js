// =============================================
// LOST & FOUND PORTAL - AngularJS Application
// =============================================

var app = angular.module('lostFoundApp', ['ngRoute']);

// ---- ROUTING ----
app.config(function($routeProvider, $locationProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider
    .when('/', { templateUrl: 'home.html', controller: 'HomeCtrl' })
    .when('/login', { templateUrl: 'login.html', controller: 'LoginCtrl' })
    .when('/register', { templateUrl: 'register.html', controller: 'RegisterCtrl' })
    .when('/items', { templateUrl: 'items.html', controller: 'ItemsCtrl' })
    .when('/add-item', { templateUrl: 'add-item.html', controller: 'AddItemCtrl' })
    .when('/item-detail/:id', { templateUrl: 'item-detail.html', controller: 'ItemDetailCtrl' })
    .when('/my-items', { templateUrl: 'my-items.html', controller: 'MyItemsCtrl' })
    .when('/admin', { templateUrl: 'admin.html', controller: 'AdminCtrl' })
    .otherwise({ redirectTo: '/' });
});

// ---- AUTH SERVICE ----
app.service('AuthService', function() {
  this.getUser = function() {
    var u = localStorage.getItem('lf_user');
    return u ? JSON.parse(u) : null;
  };
  this.setUser = function(user) {
    localStorage.setItem('lf_user', JSON.stringify(user));
  };
  this.logout = function() {
    localStorage.removeItem('lf_user');
  };
  this.getToken = function() {
    var u = this.getUser();
    return u ? u.token : null;
  };
  this.isLoggedIn = function() {
    return !!this.getUser();
  };
  this.isAdmin = function() {
    var u = this.getUser();
    return u && u.role === 'admin';
  };
});

// ---- HTTP SERVICE ----
app.service('ApiService', function($http, AuthService) {
  var self = this;

  function headers() {
    var token = AuthService.getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  self.get = function(url, params) {
    return $http.get(url, { headers: headers(), params: params });
  };
  self.post = function(url, data) {
    return $http.post(url, data, { headers: headers() });
  };
  self.put = function(url, data) {
    return $http.put(url, data, { headers: headers() });
  };
  self.delete = function(url) {
    return $http.delete(url, { headers: headers() });
  };
  self.upload = function(url, formData) {
    return $http.post(url, formData, {
      headers: angular.extend(headers(), { 'Content-Type': undefined }),
      transformRequest: angular.identity
    });
  };
  self.uploadPut = function(url, formData) {
    return $http.put(url, formData, {
      headers: angular.extend(headers(), { 'Content-Type': undefined }),
      transformRequest: angular.identity
    });
  };
});

// ---- NAV CONTROLLER ----
app.controller('NavCtrl', function($scope, $rootScope, AuthService, $location) {
  function syncUser() {
    var u = AuthService.getUser();
    $scope.isLoggedIn = !!u;
    $scope.isAdmin = u && u.role === 'admin';
    $scope.currentUser = u;
  }
  syncUser();
  $rootScope.$on('userChanged', syncUser);

  $scope.logout = function() {
    AuthService.logout();
    $rootScope.$broadcast('userChanged');
    $location.path('/');
  };
});

// ---- HOME CONTROLLER ----
app.controller('HomeCtrl', function($scope, ApiService, $location, AuthService) {
  $scope.isLoggedIn = AuthService.isLoggedIn();
  $scope.steps = [
    { icon: 'fas fa-user-plus', title: 'Create Account', desc: 'Register for free and join the community.' },
    { icon: 'fas fa-camera', title: 'Post Your Item', desc: 'Report lost or found item with details.' },
    { icon: 'fas fa-handshake', title: 'Get Connected', desc: 'Match and arrange venue for collection.' },
    { icon: 'fas fa-check-circle', title: 'Confirm & Close', desc: 'Both confirm, listing auto-removed.' }
  ];

  ApiService.get('/api/items').then(function(res) {
    $scope.recentItems = res.data;
    $scope.lostCount = res.data.filter(function(i) { return i.type === 'lost'; }).length;
    $scope.foundCount = res.data.filter(function(i) { return i.type === 'found'; }).length;
  });

  $scope.goToItem = function(id) { $location.path('/item-detail/' + id); };
});

// ---- LOGIN CONTROLLER ----
app.controller('LoginCtrl', function($scope, $rootScope, ApiService, AuthService, $location) {
  if (AuthService.isLoggedIn()) $location.path('/');

  $scope.login = function() {
    $scope.loading = true;
    $scope.error = '';
    ApiService.post('/api/auth/login', { email: $scope.email, password: $scope.password })
      .then(function(res) {
        AuthService.setUser(res.data);
        $rootScope.$broadcast('userChanged');
        $location.path(res.data.role === 'admin' ? '/admin' : '/');
      })
      .catch(function(err) {
        $scope.error = err.data.message || 'Login failed';
        $scope.loading = false;
      });
  };
});

// ---- REGISTER CONTROLLER ----
app.controller('RegisterCtrl', function($scope, $rootScope, ApiService, AuthService, $location) {
  if (AuthService.isLoggedIn()) $location.path('/');

  $scope.register = function() {
    if ($scope.password !== $scope.confirmPassword) {
      $scope.error = 'Passwords do not match';
      return;
    }
    $scope.loading = true;
    $scope.error = '';
    ApiService.post('/api/auth/register', { name: $scope.name, email: $scope.email, phone: $scope.phone, password: $scope.password })
      .then(function(res) {
        AuthService.setUser(res.data);
        $rootScope.$broadcast('userChanged');
        $scope.success = 'Account created! Redirecting...';
        setTimeout(function() { $scope.$apply(function() { $location.path('/'); }); }, 1200);
      })
      .catch(function(err) {
        $scope.error = err.data.message || 'Registration failed';
        $scope.loading = false;
      });
  };
});

// ---- ITEMS CONTROLLER ----
app.controller('ItemsCtrl', function($scope, ApiService, AuthService, $location) {
  $scope.isLoggedIn = AuthService.isLoggedIn();
  $scope.categories = ['Electronics','Clothing','Accessories','Documents','Keys','Wallet','Bag','Other'];
  $scope.filterType = '';
  $scope.filterCategory = '';
  $scope.search = '';

  $scope.loadItems = function() {
    $scope.loading = true;
    var params = {};
    if ($scope.filterType) params.type = $scope.filterType;
    if ($scope.filterCategory) params.category = $scope.filterCategory;
    if ($scope.search) params.search = $scope.search;
    ApiService.get('/api/items', params).then(function(res) {
      $scope.items = res.data;
      $scope.loading = false;
    });
  };

  $scope.clearFilters = function() {
    $scope.filterType = '';
    $scope.filterCategory = '';
    $scope.search = '';
    $scope.loadItems();
  };

  $scope.goToItem = function(id) { $location.path('/item-detail/' + id); };
  $scope.loadItems();
});

// ---- ADD ITEM CONTROLLER ----
app.controller('AddItemCtrl', function($scope, ApiService, AuthService, $location) {
  if (!AuthService.isLoggedIn()) { $location.path('/login'); return; }

  $scope.categories = ['Electronics','Clothing','Accessories','Documents','Keys','Wallet','Bag','Other'];
  $scope.itemType = 'lost';
  $scope.category = 'Other';
  $scope.selectedFile = null;

  $scope.onFileSelect = function(event) {
    $scope.selectedFile = event.target.files[0];
  };

  $scope.submitItem = function() {
    if (!$scope.title || !$scope.description || !$scope.location || !$scope.date) {
      $scope.error = 'Please fill all required fields';
      return;
    }
    $scope.loading = true;
    $scope.error = '';

    var fd = new FormData();
    fd.append('title', $scope.title);
    fd.append('description', $scope.description);
    fd.append('type', $scope.itemType);
    fd.append('category', $scope.category);
    fd.append('location', $scope.location);
    fd.append('date', $scope.date);
    if ($scope.reward) fd.append('reward', $scope.reward);
    if ($scope.internalMessage) fd.append('internalMessage', $scope.internalMessage);
    if ($scope.selectedFile) fd.append('image', $scope.selectedFile);

    ApiService.upload('/api/items', fd)
      .then(function(res) {
        $scope.success = 'Item reported successfully! Redirecting...';
        setTimeout(function() {
          $scope.$apply(function() { $location.path('/item-detail/' + res.data._id); });
        }, 1500);
      })
      .catch(function(err) {
        $scope.error = err.data.message || 'Failed to create item';
        $scope.loading = false;
      });
  };
});

// ---- ITEM DETAIL CONTROLLER ----
app.controller('ItemDetailCtrl', function($scope, ApiService, AuthService, $routeParams, $location) {
  if (!AuthService.isLoggedIn()) { $location.path('/login'); return; }

  var currentUser = AuthService.getUser();
  $scope.isAdmin = AuthService.isAdmin();
  $scope.showUpdateForm = false;

  function loadItem() {
    ApiService.get('/api/items/' + $routeParams.id)
      .then(function(res) {
        $scope.item = res.data;
        var item = res.data;
        $scope.isReporter = item.reportedBy._id === currentUser._id;
        $scope.isClaimer = item.claimedBy && item.claimedBy._id === currentUser._id;
        $scope.canClaim = AuthService.isLoggedIn() && item.status === 'open' && !$scope.isReporter;
        $scope.canConfirm = item.status === 'claimed' &&
          (($scope.isReporter && !item.reporterConfirmed) || ($scope.isClaimer && !item.claimerConfirmed));
        $scope.updateStatus = item.status;
        $scope.updateVenue = item.venueOfCollection || '';
        $scope.updateInternalMsg = item.internalMessage || '';
      })
      .catch(function() { $scope.error = 'Item not found'; });
  }

  loadItem();

  $scope.claimItem = function() {
    $scope.actionLoading = true;
    ApiService.post('/api/items/' + $routeParams.id + '/claim', {})
      .then(function() { loadItem(); $scope.actionLoading = false; })
      .catch(function(err) { $scope.error = err.data.message; $scope.actionLoading = false; });
  };

  $scope.confirmItem = function() {
    $scope.actionLoading = true;
    ApiService.post('/api/items/' + $routeParams.id + '/confirm', {})
      .then(function(res) {
        if (res.data.resolved) {
          $scope.success = res.data.message;
          setTimeout(function() { $scope.$apply(function() { $location.path('/items'); }); }, 2500);
        } else {
          $scope.success = res.data.message;
          loadItem();
        }
        $scope.actionLoading = false;
      })
      .catch(function(err) { $scope.error = err.data.message; $scope.actionLoading = false; });
  };

  $scope.submitUpdate = function() {
    $scope.actionLoading = true;
    var fd = new FormData();
    fd.append('status', $scope.updateStatus);
    fd.append('venueOfCollection', $scope.updateVenue || '');
    fd.append('internalMessage', $scope.updateInternalMsg || '');
    ApiService.uploadPut('/api/items/' + $routeParams.id, fd)
      .then(function() {
        $scope.success = 'Updated successfully!';
        $scope.showUpdateForm = false;
        loadItem();
        $scope.actionLoading = false;
      })
      .catch(function(err) { $scope.error = err.data.message; $scope.actionLoading = false; });
  };

  $scope.deleteItem = function() {
    if (!confirm('Delete this item?')) return;
    ApiService.delete('/api/items/' + $routeParams.id)
      .then(function() { $location.path('/items'); })
      .catch(function(err) { $scope.error = err.data.message; });
  };
});

// ---- MY ITEMS CONTROLLER ----
app.controller('MyItemsCtrl', function($scope, ApiService, AuthService, $location) {
  if (!AuthService.isLoggedIn()) { $location.path('/login'); return; }

  $scope.loading = true;
  ApiService.get('/api/items/my').then(function(res) {
    $scope.items = res.data;
    $scope.loading = false;
  }).catch(function() { $scope.loading = false; });

  $scope.deleteItem = function(id) {
    if (!confirm('Delete this item?')) return;
    ApiService.delete('/api/items/' + id).then(function() {
      $scope.items = $scope.items.filter(function(i) { return i._id !== id; });
    }).catch(function(err) { $scope.error = err.data.message; });
  };
});

// ---- ADMIN CONTROLLER ----
app.controller('AdminCtrl', function($scope, ApiService, AuthService, $location) {
  if (!AuthService.isAdmin()) { $location.path('/'); return; }

  $scope.tab = 'dashboard';
  $scope.stats = {};
  $scope.statsCards = [
    { key:'totalUsers',   label:'Total Users',    icon:'fas fa-users',        color:'#4e54c8', bg:'rgba(78,84,200,0.1)' },
    { key:'totalItems',   label:'Total Items',     icon:'fas fa-box-open',     color:'#4299e1', bg:'rgba(66,153,225,0.1)' },
    { key:'openItems',    label:'Open Listings',   icon:'fas fa-circle-notch', color:'#ed8936', bg:'rgba(237,137,54,0.1)' },
    { key:'claimedItems', label:'Claimed',         icon:'fas fa-handshake',    color:'#38b2ac', bg:'rgba(56,178,172,0.1)' },
    { key:'lostItems',    label:'Lost Items',      icon:'fas fa-search-minus', color:'#f86f6f', bg:'rgba(248,111,111,0.1)' },
    { key:'foundItems',   label:'Found Items',     icon:'fas fa-hand-holding', color:'#43cea2', bg:'rgba(67,206,162,0.1)' }
  ];

  ApiService.get('/api/admin/stats').then(function(res) { $scope.stats = res.data; });

  $scope.setTab = function(tab) {
    $scope.tab = tab;
    $scope.loading = true;
    if (tab === 'items') {
      ApiService.get('/api/admin/items').then(function(res) { $scope.allItems = res.data; $scope.loading = false; });
    } else if (tab === 'users') {
      ApiService.get('/api/admin/users').then(function(res) { $scope.users = res.data; $scope.loading = false; });
    } else { $scope.loading = false; }
  };

  $scope.deleteItem = function(id) {
    if (!confirm('Delete this item permanently?')) return;
    ApiService.delete('/api/admin/items/' + id).then(function() {
      $scope.allItems = $scope.allItems.filter(function(i) { return i._id !== id; });
      $scope.success = 'Item deleted';
      ApiService.get('/api/admin/stats').then(function(res) { $scope.stats = res.data; });
    }).catch(function(err) { $scope.error = err.data.message; });
  };

  $scope.deleteUser = function(id) {
    if (!confirm('Delete this user and ALL their items?')) return;
    ApiService.delete('/api/admin/users/' + id).then(function() {
      $scope.users = $scope.users.filter(function(u) { return u._id !== id; });
      $scope.success = 'User deleted';
      ApiService.get('/api/admin/stats').then(function(res) { $scope.stats = res.data; });
    }).catch(function(err) { $scope.error = err.data.message; });
  };
});