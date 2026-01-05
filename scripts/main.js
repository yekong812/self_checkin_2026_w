async function handleLogin() {
    const gi = document.getElementById("gi").value.trim();
    const name = document.getElementById("name").value.trim();
    const errorEl = document.getElementById("error-message");
    const loginBtn = document.getElementById("login-btn");
    const loadingEl = document.getElementById("loading");
  
    errorEl.style.display = "none";
    errorEl.innerText = "";
  
    if (!gi || !name) {
      errorEl.innerText = "기수와 이름을 모두 입력해주세요.";
      errorEl.style.display = "block";
      return;
    }
  
    // 로딩 상태 시작
    loginBtn.disabled = true;
    loginBtn.textContent = "확인 중...";
    loadingEl.style.display = "block";
  
    const targetUrl = `https://script.google.com/macros/s/AKfycbw21LT-qwOaDCHQKT5kHGuFGrgMfNOJtMxWQsELTJPDX_vgFixVBpawSWzPlC4GY9Gn/exec?action=verifyLoginAndPayment&gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`; // ✅ 프록시 경유

  
    try {
      const res = await fetch(proxyUrl);
      const data = await res.json();
  
      if (!data.success) {
        errorEl.innerText = "입력하신 정보가 등록되어 있지 않습니다.";
        errorEl.style.display = "block";
      } else if (data.paid) {
        window.location.href = `final.html?gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
      } else {
        window.location.href = `account.html?gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
      }
    } catch (err) {
      errorEl.innerText = "서버 연결에 실패했습니다.";
      errorEl.style.display = "block";
      console.error(err);
    } finally {
      // 로딩 상태 종료
      loginBtn.disabled = false;
      loginBtn.textContent = "로그인";
      loadingEl.style.display = "none";
    }
  }
  