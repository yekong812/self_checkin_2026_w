function base64Decode(data) {
  const raw = data.replace(/^DATA:/, ''); // 'DATA:' 접두어 제거
  const decoded = Utilities.base64Decode(raw);
  return Utilities.newBlob(decoded).getDataAsString();
}

function doGet(e) {
  try {
    // e가 없거나 parameter가 없는 경우 처리
    if (!e || !e.parameter) {
      return jsonResponse({ 
        success: false, 
        error: "Invalid request parameters" 
      });
    }

    const action = e.parameter.action;
    const gi = normalizeGi(e.parameter.gi);
    const name = e.parameter.name?.trim();

    if (!gi || !name) {
      return jsonResponse({ 
        success: false, 
        error: "Missing parameters" 
      });
    }

    if (action === "verifyLoginAndPayment") {
      return handleVerifyLoginAndPayment(gi, name);
    } else if (action === "getUserInfo") {
      return handleGetUserInfo(gi, name);
    }

    return jsonResponse({ 
      success: false, 
      error: "Invalid action" 
    });
    
  } catch (error) {
    console.error("doGet 오류:", error);
    return jsonResponse({ 
      success: false, 
      error: "서버 오류: " + error.toString() 
    });
  }
}

function normalizeGi(giValue) {
  const numberMatch = giValue?.toString().match(/\d+/);
  return numberMatch ? parseInt(numberMatch[0]) : null;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ✅ 1. 로그인 & 명단단 확인
function handleVerifyLoginAndPayment(gi, name) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return jsonResponse({ 
        success: false, 
        error: "스프레드시트에 접근할 수 없습니다." 
      });
    }
    
    const paymentSheet = ss.getSheetByName("명단단");
    if (!paymentSheet) {
      return jsonResponse({ 
        success: false, 
        error: "명단단 시트를 찾을 수 없습니다." 
      });
    }
    
    // 더 안전한 데이터 접근
    const lastRow = paymentSheet.getLastRow();
    const lastCol = paymentSheet.getLastColumn();
    
    if (lastRow === 0 || lastCol === 0) {
      return jsonResponse({ 
        success: false, 
        error: "명단단 시트에 데이터가 없습니다." 
      });
    }
    
    const data = paymentSheet.getRange(1, 1, lastRow, lastCol).getValues();

    // 명단단 시트에서 로그인 확인 및 명단단 상태 확인
    let found = false;
    let paid = false;
    
    for (let row of data) {
      if (!row || row.length < 3) continue; // 3열 미만이면 건너뛰기
      
      const rowGi = normalizeGi(row[0]); // 1열: 기수
      const rowName = (row[1] + "").trim(); // 2열: 이름
      const status = row[2]; // 3열: 명단단 납부 여부
      
      if (rowGi === gi && rowName === name) {
        found = true;
        // O 또는 o인 경우만 true 반환
        if (status === "O" || status === "o") {
          paid = true;
        }
        break;
      }
    }

    if (!found) {
      return jsonResponse({ success: false });
    }

    return jsonResponse({ success: true, paid });
    
  } catch (error) {
    console.error("handleVerifyLoginAndPayment 오류:", error);
    return jsonResponse({ 
      success: false, 
      error: "서버 오류: " + error.toString() 
    });
  }
}

function checkPaymentStatus(gi, name, ss) {
  try {
    if (!ss) {
      console.error("스프레드시트 객체가 null입니다");
      return false;
    }
    
    // gi를 숫자로 정규화 (타입 일치를 위해)
    const normalizedGi = normalizeGi(gi);
    if (!normalizedGi) {
      console.error("기수 정규화 실패:", gi);
      return false;
    }
    
    const paymentSheet = ss.getSheetByName("명단단");
    if (!paymentSheet) {
      console.error("명단단 시트를 찾을 수 없습니다");
      return false;
    }
    
    // 더 안전한 데이터 접근
    const lastRow = paymentSheet.getLastRow();
    const lastCol = paymentSheet.getLastColumn();
    
    if (lastRow === 0 || lastCol === 0) {
      console.error("명단단 시트에 데이터가 없습니다");
      return false;
    }
    
    const data = paymentSheet.getRange(1, 1, lastRow, lastCol).getValues();

    for (let row of data) {
      if (!row || row.length < 3) continue; // 3열 미만이면 건너뛰기
      
      const rowGi = normalizeGi(row[0]); // 1열: 기수
      const rowName = (row[1] + "").trim(); // 2열: 이름
      const status = row[2]; // 3열: 명단단 납부 여부
      
      // 숫자끼리 비교 (타입 일치)
      if (rowGi === normalizedGi && rowName === name) {
        // null, undefined, 빈 문자열인 경우 false 반환
        if (status === null || status === undefined || status === "") {
          return false;
        }
        // O 또는 o인 경우만 true 반환
        return status === "O" || status === "o";
      }
    }
    return false;
  } catch (error) {
    console.error("checkPaymentStatus 오류:", error);
    return false;
  }
}

// ✅ 2. 사용자 정보 제공 (간소화 - 티셔츠 사이즈와 조 정보 제거)
function handleGetUserInfo(gi, name) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return jsonResponse({ 
        success: false, 
        error: "스프레드시트에 접근할 수 없습니다." 
      });
    }
    
    return jsonResponse({
      success: true,
      gi: `${gi}기`,
      name: name
    });
    
  } catch (error) {
    console.error("handleGetUserInfo 오류:", error);
    return jsonResponse({ 
      success: false, 
      error: "서버 오류: " + error.toString() 
    });
  }
}

// 테스트용 함수들
function testSimple() {
  return jsonResponse({
    success: true,
    message: "테스트 성공"
  });
}

function testFindUser() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName("명단단");
  
  if (!responseSheet) {
    console.log("시트를 찾을 수 없습니다");
    return;
  }
  
  const data = responseSheet.getDataRange().getValues();
  console.log("전체 데이터:", data);
  
  // 첫 번째 행 확인
  if (data.length > 0) {
    console.log("첫 번째 행:", data[0]);
    console.log("첫 번째 행의 길이:", data[0].length);
  }
}

function testGetUserInfo() {
  const testGi = "19";
  const testName = "이은선";
  
  const result = handleGetUserInfo(testGi, testName);
  console.log("테스트 결과:", result);
  return result;
}

function testCheckPaymentStatus() {
  const testGi = "19";
  const testName = "이은선";
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log("스프레드시트 객체:", ss ? "존재" : "null");
    
    if (ss) {
      const result = checkPaymentStatus(testGi, testName, ss);
      console.log("명단단 확인 결과:", result);
      return result;
    } else {
      console.error("스프레드시트에 접근할 수 없습니다");
      return false;
    }
  } catch (error) {
    console.error("테스트 오류:", error);
    return false;
  }
}

// 더 간단한 테스트 함수
function testCheckPaymentStatusSimple() {
  const testGi = "19";
  const testName = "이은선";
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log("스프레드시트 객체:", ss ? "존재" : "null");
    
    if (!ss) {
      console.error("스프레드시트에 접근할 수 없습니다");
      return false;
    }
    
    const paymentSheet = ss.getSheetByName("명단단");
    console.log("명단단 시트:", paymentSheet ? "존재" : "null");
    
    if (!paymentSheet) {
      console.error("명단단 시트를 찾을 수 없습니다");
      return false;
    }
    
    const lastRow = paymentSheet.getLastRow();
    const lastCol = paymentSheet.getLastColumn();
    console.log("명단단 시트 크기:", lastRow, "행 x", lastCol, "열");
    
    if (lastRow === 0 || lastCol === 0) {
      console.error("명단단 시트에 데이터가 없습니다");
      return false;
    }
    
    const data = paymentSheet.getRange(1, 1, lastRow, lastCol).getValues();
    console.log("명단단 데이터 행 수:", data.length);
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 3) {
        console.log(`행 ${i}: 3열 미만, 건너뛰기`);
        continue;
      }
      
      const rowGi = normalizeGi(row[0]); // 1열: 기수
      const rowName = (row[1] + "").trim(); // 2열: 이름
      const status = row[2]; // 3열: 명단단 납부 여부
      
      console.log(`행 ${i}: 기수=${rowGi}, 이름=${rowName}, 상태=${status}, 찾는값=${testGi}, ${testName}`);
      
      if (rowGi === testGi && rowName === testName) {
        // null, undefined, 빈 문자열인 경우 false 반환
        if (status === null || status === undefined || status === "") {
          console.log("사용자 찾음! 명단단 미납부 (null/empty)");
          return false;
        }
        // O 또는 o인 경우만 true 반환
        const result = status === "O" || status === "o";
        console.log("사용자 찾음! 명단단 납부:", result);
        return result;
      }
    }
    
    console.log("사용자를 찾을 수 없습니다");
    return false;
    
  } catch (error) {
    console.error("테스트 오류:", error);
    return false;
  }
} 