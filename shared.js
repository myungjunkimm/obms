const STORAGE_KEYS = {
    LAND_OPERATORS: 'landOperators',
    GUIDES: 'guides',
    EVENTS: 'events',
    REVIEWS: 'reviews'
};

function getLandOperators() {
    const data = localStorage.getItem(STORAGE_KEYS.LAND_OPERATORS);
    if (!data) {
        const defaultOperator = {
            id: Date.now(),
            companyName: '바르셀로나 트래블',
            companyType: '랜드사'
        };
        localStorage.setItem(STORAGE_KEYS.LAND_OPERATORS, JSON.stringify([defaultOperator]));
        return [defaultOperator];
    }
    return JSON.parse(data);
}

function addLandOperator(operator) {
    const operators = getLandOperators();
    operators.push(operator);
    localStorage.setItem(STORAGE_KEYS.LAND_OPERATORS, JSON.stringify(operators));
}

function removeLandOperator(id) {
    const operators = getLandOperators();
    const filtered = operators.filter(op => op.id !== id);
    localStorage.setItem(STORAGE_KEYS.LAND_OPERATORS, JSON.stringify(filtered));
}

function getGuides() {
    const data = localStorage.getItem(STORAGE_KEYS.GUIDES);
    if (!data) {
        const defaultGuide = {
            id: Date.now(),
            name: '김알파',
            type: '인솔자',
            affiliation: '바르셀로나 트래블',
            npsAverage: null,
            lastAssignedDate: null
        };
        localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify([defaultGuide]));
        return [defaultGuide];
    }
    return JSON.parse(data);
}

function addGuide(guide) {
    const guides = getGuides();
    guides.push(guide);
    localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(guides));
}

function removeGuide(id) {
    const guides = getGuides();
    const filtered = guides.filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(filtered));
}

function getEvents() {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return data ? JSON.parse(data) : [];
}

function addEvent(event) {
    const events = getEvents();
    events.push(event);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

function removeEvent(id) {
    const events = getEvents();
    const filtered = events.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));
}

function getReviews() {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : [];
}

function addReview(review) {
    const reviews = getReviews();
    reviews.push(review);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
}

function removeReview(id) {
    const reviews = getReviews();
    const filtered = reviews.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(filtered));
}

function calculateEventEndDate(eventPeriod) {
    if (!eventPeriod || !eventPeriod.includes('-')) return null;
    
    const parts = eventPeriod.split('-');
    if (parts.length !== 2) return null;
    
    const endDateStr = parts[1].trim();
    const dateParts = endDateStr.split('.');
    if (dateParts.length !== 3) return null;
    
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    
    return new Date(year, month, day);
}

function isWithin14Days(eventPeriod) {
    const eventEndDate = calculateEventEndDate(eventPeriod);
    if (!eventEndDate) return true; // If can't parse date, allow editing
    
    const today = new Date();
    const diffTime = today - eventEndDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 14;
}

function updateReviewStatusBasedOnDate() {
    const reviews = getReviews();
    let updated = false;
    
    console.log('updateReviewStatusBasedOnDate: 시작, 리뷰 개수:', reviews.length);
    
    reviews.forEach(review => {
        console.log('리뷰 처리:', review.participantName, '현재 상태:', review.status);
        
        if (review.status !== '삭제됨') {
            // Try to get event period from review data first, then from events
            let eventPeriod = review.eventPeriod;
            if (!eventPeriod) {
                const events = getEvents();
                const event = events.find(e => e.id === review.eventId);
                eventPeriod = event ? event.period : null;
            }
            
            console.log('이벤트 기간:', eventPeriod);
            
            // Calculate review deadline (event end date + 14 days)
            if (eventPeriod && eventPeriod.includes('-')) {
                console.log('eventPeriod 분석 시작:', eventPeriod);
                const parts = eventPeriod.split(' - ');
                console.log('split 결과:', parts);
                let endDateStr = parts.length === 2 ? parts[1].trim() : eventPeriod.split('-')[1]?.trim();
                console.log('endDateStr:', endDateStr);
                console.log('parseDate 호출 전');
                const endDate = parseEventDate(endDateStr);
                console.log('parseEventDate 호출 후, 결과:', endDate);
                console.log('종료일:', endDate);
                
                if (endDate) {
                    const reviewDeadlineDate = new Date(endDate);
                    reviewDeadlineDate.setDate(reviewDeadlineDate.getDate() + 14);
                    reviewDeadlineDate.setHours(0, 0, 0, 0);
                    
                    const simulatedDate = localStorage.getItem('simulatedDate');
                    const currentDate = simulatedDate ? new Date(simulatedDate) : new Date();
                    const compareDate = new Date(currentDate);
                    compareDate.setHours(0, 0, 0, 0);
                    
                    console.log('마감일:', reviewDeadlineDate, '현재일:', compareDate);
                    console.log('마감일 지났나?', compareDate >= reviewDeadlineDate);
                    
                    if (compareDate >= reviewDeadlineDate) {
                        if (review.status === '제출' || review.status === '수정됨') {
                            console.log('상태 변경:', review.participantName, review.status, '→ 평가 완료');
                            review.status = '평가 완료';
                            updated = true;
                        }
                    }
                }
            }
        }
    });
    
    console.log('업데이트 필요?', updated);
    
    if (updated) {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
        console.log('리뷰 상태 업데이트 완료');
    }
    
    return reviews;
}

function parseEventDate(dateStr) {
    console.log('parseEventDate 입력:', dateStr);
    
    if (!dateStr) {
        console.log('parseEventDate: dateStr이 없음');
        return null;
    }
    
    // Handle both formats: 2025.09.10 and 2025-09-10
    let parts;
    if (dateStr.includes('.')) {
        parts = dateStr.split('.');
        console.log('parseEventDate: 점 구분자 사용');
    } else if (dateStr.includes('-')) {
        parts = dateStr.split('-');
        console.log('parseEventDate: 하이픈 구분자 사용');
    } else {
        console.log('parseEventDate: 지원하지 않는 형식');
        return null;
    }
    
    console.log('parseEventDate parts:', parts);
    
    if (parts.length !== 3) {
        console.log('parseEventDate: parts 길이가 3이 아님, 길이:', parts.length);
        return null;
    }
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    
    console.log('parseEventDate 파싱 결과:', year, month + 1, day);
    
    const result = new Date(year, month, day);
    console.log('parseEventDate 최종 결과:', result);
    
    return result;
}

function parseDate(dateStr) {
    console.log('parseDate 입력:', dateStr);
    
    // Handle both formats: 2025.09.10 and 2025-09-10
    let parts;
    if (dateStr.includes('.')) {
        parts = dateStr.split('.');
    } else if (dateStr.includes('-')) {
        parts = dateStr.split('-');
    } else {
        console.log('parseDate: 지원하지 않는 형식');
        return null;
    }
    
    console.log('parseDate parts:', parts);
    
    if (parts.length !== 3) {
        console.log('parseDate: parts 길이가 3이 아님');
        return null;
    }
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    
    console.log('parseDate 결과:', year, month + 1, day);
    
    const result = new Date(year, month, day);
    console.log('parseDate 최종 결과:', result);
    
    return result;
}

function getReviewStatus(review) {
    if (review.status === '삭제됨') return '삭제됨';
    
    // Get event period from events data using eventId
    const events = getEvents();
    const event = events.find(e => e.id === review.eventId);
    const eventPeriod = event ? event.period : null;
    
    // Calculate review deadline (event end date + 14 days)
    if (eventPeriod && eventPeriod.includes('-')) {
        const parts = eventPeriod.split(' - ');
        let endDateStr = parts.length === 2 ? parts[1].trim() : eventPeriod.split('-')[1]?.trim();
        const endDate = parseDate(endDateStr);
        if (endDate) {
            const reviewDeadlineDate = new Date(endDate);
            reviewDeadlineDate.setDate(reviewDeadlineDate.getDate() + 14);
            reviewDeadlineDate.setHours(0, 0, 0, 0);
            
            const simulatedDate = localStorage.getItem('simulatedDate');
            const currentDate = simulatedDate ? new Date(simulatedDate) : new Date();
            const compareDate = new Date(currentDate);
            compareDate.setHours(0, 0, 0, 0);
            
            if (compareDate >= reviewDeadlineDate) {
                return '평가 완료';
            }
        }
    }
    
    return review.status;
}

function getCurrentDateDisplay() {
    const simulatedDate = localStorage.getItem('simulatedDate');
    if (simulatedDate) {
        const date = new Date(simulatedDate);
        return `${date.toLocaleDateString('ko-KR')} (시뮬레이션)`;
    } else {
        return new Date().toLocaleDateString('ko-KR');
    }
}

function addCurrentDateDisplay() {
    const header = document.querySelector('h1');
    if (header) {
        const dateDiv = document.createElement('div');
        dateDiv.id = 'currentDateDisplay';
        dateDiv.style.fontSize = '14px';
        dateDiv.style.color = '#666';
        dateDiv.style.marginTop = '5px';
        dateDiv.textContent = `현재 날짜: ${getCurrentDateDisplay()}`;
        
        const simulatedDate = localStorage.getItem('simulatedDate');
        if (simulatedDate) {
            dateDiv.style.color = '#dc3545';
            dateDiv.style.fontWeight = 'bold';
        }
        
        header.appendChild(dateDiv);
    }
}