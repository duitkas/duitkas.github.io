const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxkxJd6qnSUiIfap6sIDg6ItHzCtqXTuf1UFTkvjGaCbSELVpyUsPHu65MVmNUxubPrIQ/exec";

window.safeGetStorage = function(key, fallback) { try { var val = localStorage.getItem(key); return val ? JSON.parse(val) : fallback; } catch (e) { return fallback; } };
window.safeSetStorage = function(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} };

window.ADMIN_USERNAME = "Rawetjoy"; 
window.ADMIN_PASSWORD = "kembang"; 

window.isAdminLoggedIn = false;
window.tableUnlocked = { dangdut: false, makam: false };

window.defaultBg = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000";
window.defaultLalunaPhoto = "https://i.postimg.cc/W4L4L3Fb/IMG-20260820-132510-843.jpg"; 
window.defaultFooterText = "20 Agustus 2026";

window.activeFilter = {
    dangdutType: 'Pemasukan',
    dangdutYear: '2026',
    makamType: 'Pemasukan'
};

window.initialStore = {
    dangdut: [
        { id: 1, date: "2026-04-12", desc: "Kas Pemuda 2026", type: "Pemasukan", amount: 2500000 },
        { id: 2, date: "2026-04-15", desc: "Sewa Panggung & Sound 2026", type: "Pengeluaran", amount: 1200000 },
        { id: 3, date: "2027-04-02", desc: "Kas Pemuda 2027", type: "Pemasukan", amount: 3000000 },
        { id: 4, date: "2027-04-05", desc: "DP Artis & Dekorasi 2027", type: "Pengeluaran", amount: 1500000 }
    ],
    makam: [
        { id: 1, date: "2026-08-01", desc: "Iuran Warga Agustus", type: "Pemasukan", amount: 500000 },
        { id: 2, date: "2026-08-05", desc: "Beli Token Listrik", type: "Pengeluaran", amount: 150000 }
    ]
};

if (!localStorage.getItem('kembang_store')) {
    window.safeSetStorage('kembang_store', window.initialStore);
}
window.store = window.safeGetStorage('kembang_store', window.initialStore);

function syncToGoogleSheet(actionType, payload) {
    if (!APPS_SCRIPT_URL) return;
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, data: payload })
    }).catch(err => console.error("Sync Error:", err));
}

function fetchDataFromSheet() {
    if (!APPS_SCRIPT_URL) return;
    fetch(APPS_SCRIPT_URL + "?action=get")
        .then(res => res.json())
        .then(data => {
            if (data && (data.dangdut || data.makam)) {
                window.store = data;
                window.safeSetStorage('kembang_store', window.store);
                renderAll();
            }
        })
        .catch(err => {
            console.error("Gagal mengambil data:", err);
        });
}

window.addEventListener('load', function() {
    fetchDataFromSheet();
});

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
}

function openPhotoModal() {
    var photoUrl = window.safeGetStorage('kembang_laluna_photo', window.defaultLalunaPhoto);
    document.getElementById('laluna-img').src = photoUrl;
    document.getElementById('photo-modal').classList.add('active');
}

function closePhotoModal(e) {
    document.getElementById('photo-modal').classList.remove('active');
}

function changeLalunaPhoto() {
    if (!window.isAdminLoggedIn) return;
    var url = document.getElementById('input-laluna-url').value.trim();
    if (url) {
        window.safeSetStorage('kembang_laluna_photo', url);
    }
}

function setYearFilter(category, year) {
    window.activeFilter[category + 'Year'] = year;
    var y26 = document.getElementById(`filter-${category}-2026`);
    var y27 = document.getElementById(`filter-${category}-2027`);

    if (y26 && y27) {
        y26.className = 'btn-filter';
        y27.className = 'btn-filter';
        if (year === '2026') y26.classList.add('active-year');
        if (year === '2027') y27.classList.add('active-year');
    }
    render(category);
}

function setTypeFilter(category, type) {
    window.activeFilter[category + 'Type'] = type;
    var inBtn = document.getElementById(`filter-${category}-in`);
    var outBtn = document.getElementById(`filter-${category}-out`);

    inBtn.className = 'btn-filter';
    outBtn.className = 'btn-filter';

    if (type === 'Pemasukan') inBtn.classList.add('active-in');
    else if (type === 'Pengeluaran') outBtn.classList.add('active-out');

    render(category);
}

function toggleTableLock(category) {
    if (!window.isAdminLoggedIn) return;
    window.tableUnlocked[category] = !window.tableUnlocked[category];
    render(category);
}

function toggleAdminMode() { 
    if (!window.isAdminLoggedIn) { 
        document.getElementById('login-modal').classList.add('active'); 
    } else { 
        var descVal = document.getElementById('input-desc').value.trim();
        var amountVal = parseInt(document.getElementById('input-amount').value) || 0;
        
        if (descVal && amountVal) { saveTransaction(); }

        window.isAdminLoggedIn = false; 
        window.tableUnlocked.dangdut = false;
        window.tableUnlocked.makam = false;

        document.getElementById('admin-panel').style.display = 'none'; 
        document.getElementById('admin-lock-btn').innerText = '🔒';
        document.getElementById('admin-lock-btn').title = "Login";
        resetForm();
        renderAll(); 
    } 
}

function submitLogin() { 
    if(document.getElementById('admin-user-input').value === window.ADMIN_USERNAME && document.getElementById('admin-pass-input').value === window.ADMIN_PASSWORD) { 
        window.isAdminLoggedIn = true; 
        document.getElementById('admin-panel').style.display = 'block'; 
        showTransactionForm();

        document.getElementById('login-modal').classList.remove('active'); 
        document.getElementById('admin-lock-btn').innerText = '💾';
        document.getElementById('admin-lock-btn').title = "Simpan & Kunci";
        
        document.getElementById('input-new-user').value = window.ADMIN_USERNAME;
        document.getElementById('input-new-pass').value = window.ADMIN_PASSWORD;

        loadFooterSettingsUI();
        renderAll(); 
    }
}

function showTransactionForm() {
    document.getElementById('bg-settings-panel').style.display = 'none';
    document.getElementById('account-settings-panel').style.display = 'none';
    document.getElementById('footer-settings-panel').style.display = 'none';
    document.getElementById('transaction-form-panel').style.display = 'block';
    document.getElementById('admin-panel-title').innerText = "📝 Input / Edit Transaksi";
}

function toggleBgSettings() {
    var bgPanel = document.getElementById('bg-settings-panel');
    if (bgPanel.style.display === 'block') {
        showTransactionForm();
    } else {
        document.getElementById('bg-settings-panel').style.display = 'block';
        document.getElementById('account-settings-panel').style.display = 'none';
        document.getElementById('footer-settings-panel').style.display = 'none';
        document.getElementById('transaction-form-panel').style.display = 'none';
        document.getElementById('admin-panel-title').innerText = "🖼️ Pengaturan Gambar BG & Laluna";
    }
}

function toggleAccountSettings() {
    var accPanel = document.getElementById('account-settings-panel');
    if (accPanel.style.display === 'block') {
        showTransactionForm();
    } else {
        document.getElementById('account-settings-panel').style.display = 'block';
        document.getElementById('bg-settings-panel').style.display = 'none';
        document.getElementById('footer-settings-panel').style.display = 'none';
        document.getElementById('transaction-form-panel').style.display = 'none';
        document.getElementById('admin-panel-title').innerText = "👤 Ganti Username & Password";
    }
}

function toggleFooterSettings() {
    var footerPanel = document.getElementById('footer-settings-panel');
    if (footerPanel.style.display === 'block') {
        showTransactionForm();
    } else {
        document.getElementById('footer-settings-panel').style.display = 'block';
        document.getElementById('bg-settings-panel').style.display = 'none';
        document.getElementById('account-settings-panel').style.display = 'none';
        document.getElementById('transaction-form-panel').style.display = 'none';
        document.getElementById('admin-panel-title').innerText = "📅 Pengaturan Tanggal Footer";
    }
}

function loadFooterSettingsUI() {
    var isVisible = window.safeGetStorage('kembang_footer_active', true);
    var footerText = window.safeGetStorage('kembang_footer_text', window.defaultFooterText);
    document.getElementById('input-footer-text').value = footerText;
    updateFooterToggleButton(isVisible);
}

function toggleFooterActive() {
    var currentStatus = window.safeGetStorage('kembang_footer_active', true);
    var newStatus = !currentStatus;
    window.safeSetStorage('kembang_footer_active', newStatus);
    updateFooterToggleButton(newStatus);
    applyFooterSettings();
}

function updateFooterToggleButton(isActive) {
    var btn = document.getElementById('btn-toggle-footer-status');
    if (isActive) {
        btn.innerText = "Aktif";
        btn.style.backgroundColor = "#48bb78";
    } else {
        btn.innerText = "Nonaktif";
        btn.style.backgroundColor = "#e53e3e";
    }
}

function saveFooterText() {
    if (!window.isAdminLoggedIn) return;
    var textVal = document.getElementById('input-footer-text').value.trim();
    if (textVal) {
        window.safeSetStorage('kembang_footer_text', textVal);
        applyFooterSettings();
    }
}

function applyFooterSettings() {
    var isVisible = window.safeGetStorage('kembang_footer_active', true);
    var footerText = window.safeGetStorage('kembang_footer_text', window.defaultFooterText);
    var footerEl = document.getElementById('footer-update-info');
    
    document.getElementById('footer-date-text').innerText = footerText;
    if (isVisible) {
        footerEl.style.display = 'block';
    } else {
        footerEl.style.display = 'none';
    }
}

function changeAccountCredentials() {
    if (!window.isAdminLoggedIn) return;
    var newUser = document.getElementById('input-new-user').value.trim();
    var newPass = document.getElementById('input-new-pass').value.trim();

    if (newUser && newPass) {
        window.ADMIN_USERNAME = newUser;
        window.ADMIN_PASSWORD = newPass;
        window.safeSetStorage('kembang_user', newUser);
        window.safeSetStorage('kembang_pass', newPass);
        showTransactionForm();
    }
}

function loadBackground() {
    var savedBg = window.safeGetStorage('kembang_bg', window.defaultBg);
    document.getElementById('bg-overlay').style.backgroundImage = `url('${savedBg}')`;
    document.getElementById('input-bg-url').value = savedBg;
    
    var savedOpacity = window.safeGetStorage('kembang_bg_opacity', "0.15");
    document.getElementById('bg-overlay').style.opacity = savedOpacity;
    document.getElementById('bg-opacity-slider').value = savedOpacity;
    document.getElementById('bg-opacity-label').innerText = Math.round(savedOpacity * 100) + "%";

    var savedLaluna = window.safeGetStorage('kembang_laluna_photo', window.defaultLalunaPhoto);
    document.getElementById('input-laluna-url').value = savedLaluna;

    applyFooterSettings();
}

function changeBackground() {
    if (!window.isAdminLoggedIn) return;
    var url = document.getElementById('input-bg-url').value.trim();
    if (url) {
        window.safeSetStorage('kembang_bg', url);
        document.getElementById('bg-overlay').style.backgroundImage = `url('${url}')`;
    }
}

function adjustBgOpacity(val) {
    document.getElementById('bg-overlay').style.opacity = val;
    document.getElementById('bg-opacity-label').innerText = Math.round(val * 100) + "%";
    window.safeSetStorage('kembang_bg_opacity', val);
}

function resetBackground() {
    if (!window.isAdminLoggedIn) return;
    window.safeSetStorage('kembang_bg', window.defaultBg);
    window.safeSetStorage('kembang_bg_opacity', "0.15");
    
    document.getElementById('bg-overlay').style.backgroundImage = `url('${window.defaultBg}')`;
    document.getElementById('bg-overlay').style.opacity = "0.15";
    document.getElementById('input-bg-url').value = window.defaultBg;
    document.getElementById('bg-opacity-slider').value = "0.15";
    document.getElementById('bg-opacity-label').innerText = "15%";
}

function formatRupiah(number) { return "Rp " + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

function formatDateNumeric(dateStr) {
    if (!dateStr || dateStr.trim() === "") return "-";
    var parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function saveTransaction() {
    var editId = document.getElementById('edit-id').value;
    var cat = document.getElementById('input-category').value;
    var dateVal = document.getElementById('input-date').value.trim();
    var descVal = document.getElementById('input-desc').value;
    var typeVal = document.getElementById('input-type').value;
    var amountVal = parseInt(document.getElementById('input-amount').value) || 0;

    var transactionPayload = {
        id: editId ? parseInt(editId) : Date.now(),
        category: cat,
        date: dateVal,
        desc: descVal,
        type: typeVal,
        amount: amountVal
    };

    if (editId) {
        var itemIndex = window.store[cat].findIndex(item => item.id == editId);
        if (itemIndex !== -1) {
            window.store[cat][itemIndex] = transactionPayload;
        }
    } else {
        window.store[cat].push(transactionPayload);
    }

    window.safeSetStorage('kembang_store', window.store);
    syncToGoogleSheet('add', transactionPayload);
}

function handleFormSubmit(e) {
    if (e) e.preventDefault();
    var descVal = document.getElementById('input-desc').value;
    var amountVal = parseInt(document.getElementById('input-amount').value) || 0;

    if (!descVal || !amountVal) return;

    saveTransaction();
    resetForm();
    renderAll();
}

function editItem(category, id) {
    if (!window.isAdminLoggedIn || !window.tableUnlocked[category]) return;
    showTransactionForm();

    var item = window.store[category].find(i => i.id === id);
    if (!item) return;

    document.getElementById('edit-id').value = item.id;
    document.getElementById('input-category').value = category;
    document.getElementById('input-date').value = item.date || "";
    document.getElementById('input-type').value = item.type;
    document.getElementById('input-desc').value = item.desc;
    document.getElementById('input-amount').value = item.amount;

    document.getElementById('btn-save').innerText = "💾 Perbarui Data";
    document.getElementById('btn-cancel').style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('edit-id').value = "";
    document.getElementById('input-date').value = "";
    document.getElementById('input-desc').value = "";
    document.getElementById('input-amount').value = "";
    document.getElementById('btn-save').innerText = "➕ Simpan Data";
    document.getElementById('btn-cancel').style.display = "none";
}

function deleteItem(category, id) {
    if (!window.isAdminLoggedIn || !window.tableUnlocked[category]) return;
    window.store[category] = window.store[category].filter(item => item.id !== id);
    window.safeSetStorage('kembang_store', window.store);
    renderAll();
}

function switchMainTab(tabKey) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active-dangdut', 'active-makam'));
    document.getElementById('tab-' + tabKey).classList.add('active');
    document.getElementById('tab-btn-' + tabKey).classList.add(tabKey === 'dangdut' ? 'active-dangdut' : 'active-makam');
}

function renderAll() { render('dangdut'); render('makam'); }

function render(key) {
    var list = window.store[key] || [];
    var tbody = document.getElementById(key + '-tbody');
    tbody.innerHTML = "";
    
    var selectedType = window.activeFilter[key + 'Type'];
    var selectedYear = key === 'dangdut' ? window.activeFilter['dangdutYear'] : null;

    var thAction = document.getElementById('th-action-' + key);
    
    if (window.isAdminLoggedIn) {
        thAction.style.display = 'table-cell';
        var isUnlocked = window.tableUnlocked[key];
        thAction.innerHTML = `AKSI <span style="cursor:pointer; font-size:13px; margin-left:4px;" onclick="toggleTableLock('${key}')" title="${isUnlocked ? 'Klik untuk Kunci' : 'Klik untuk Buka Gembok'}">${isUnlocked ? '🔓' : '🔒'}</span>`;
    } else {
        thAction.style.display = 'none';
    }

    if (key === 'dangdut') {
        var subtitleContainer = document.getElementById('dangdut-subtitle-container');
        if (selectedYear === '2027') {
            subtitleContainer.style.display = 'flex';
        } else {
            subtitleContainer.style.display = 'none';
        }
    }

    var yearFilteredList = list;
    if (key === 'dangdut' && selectedYear) {
        yearFilteredList = list.filter(item => {
            if (!item.date || item.date === "") {
                return selectedYear === '2026';
            }
            return item.date.startsWith(selectedYear);
        });
    }

    var totalIn = 0, totalOut = 0;
    yearFilteredList.forEach((item) => {
        if (item.type === "Pemasukan") totalIn += (parseInt(item.amount) || 0);
        else totalOut += (parseInt(item.amount) || 0);
    });

    var finalFilteredList = yearFilteredList.filter(item => item.type === selectedType);

    if (finalFilteredList.length === 0) {
        var colSpanCount = window.isAdminLoggedIn ? 6 : 5;
        tbody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align:center; padding: 12px; color:#718096;">Tidak ada data ${selectedType}${selectedYear ? ' tahun ' + selectedYear : ''}</td></tr>`;
    } else {
        finalFilteredList.forEach((item, index) => {
            var actionBtns = "";
            var tdActionHtml = "";
            
            if (window.isAdminLoggedIn && window.tableUnlocked[key]) {
                actionBtns = `<div class="action-btns">
                    <button class="btn-action btn-edit" onclick="editItem('${key}',${item.id})">✏️</button>
                    <button class="btn-action btn-delete" onclick="deleteItem('${key}',${item.id})">🗑️</button>
                   </div>`;
                tdActionHtml = `<td class="col-aksi">${actionBtns}</td>`;
            } else if (window.isAdminLoggedIn) {
                tdActionHtml = `<td class="col-aksi" style="color:#718096; font-size:10px;">Terkunci 🔒</td>`;
            }

            var displayDate = formatDateNumeric(item.date);

            tbody.innerHTML += `<tr>
                <td class="col-no">${index+1}</td>
                <td class="col-nama">${item.desc || '-'}</td>
                <td class="col-jenis"><span class="badge ${item.type === 'Pemasukan' ? 'badge-in' : 'badge-out'}">${item.type}</span></td>
                <td class="col-jumlah">${formatRupiah(item.amount || 0)}</td>
                <td class="col-tanggal">${displayDate}</td>${tdActionHtml}
            </tr>`;
        });
    }
    
    document.getElementById(key + '-total-in').innerText = formatRupiah(totalIn);
    document.getElementById(key + '-total-out').innerText = formatRupiah(totalOut);
    document.getElementById(key + '-balance').innerText = formatRupiah(totalIn - totalOut);
}

loadBackground();
renderAll();