// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '로그인 사용자·기기·세션');

      const heading = document.createElement('h3');
      heading.textContent = '로그인 사용자·기기·세션';
      root.append(heading);

      const modeLabels = {
        connected: '연결됨',
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };
      const deviceStatusLabels = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionStatusLabels = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };

      const addLine = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.append(node);
        return node;
      };
      const addValue = (list, label, value) => {
        addLine(list, 'dt', label);
        addLine(list, 'dd', value);
      };
      const addResource = (title, resource, renderData) => {
        const section = document.createElement('section');
        addLine(section, 'h4', title);

        const mode = modeLabels[resource?.mode] || '확인 불가';
        addLine(section, 'p', `데이터 모드: ${mode}`);

        if (resource?.status === 'loading') {
          const message = addLine(section, 'p', '불러오는 중');
          message.setAttribute('role', 'status');
        } else if (resource?.status === 'error') {
          const error = resource.error;
          const detail = typeof error?.message === 'string' && error.message.length > 0
            ? error.message
            : '서버가 오류 내용을 제공하지 않았습니다.';
          const unverifiable = ['CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(error?.code);
          const message = addLine(section, 'p', `${unverifiable ? '확인 불가' : '연결 실패'}: ${detail}`);
          message.setAttribute('role', 'alert');
        } else if (resource?.status === 'ok') {
          renderData(section, resource.data);
        } else {
          const message = addLine(section, 'p', '확인 불가: 응답 상태를 확인할 수 없습니다.');
          message.setAttribute('role', 'status');
        }

        root.append(section);
      };

      addResource('계정 및 현재 상태', me, (section, data) => {
        const user = data?.user;
        const device = data?.device;
        const session = data?.session;
        if (!user || !device || !session) {
          addLine(section, 'p', '확인 불가: 로그인 사용자·기기·세션 자료가 계약과 다릅니다.');
          return;
        }
        const details = document.createElement('dl');
        addValue(details, '사용자', user.label || '이름 확인 불가');
        addValue(details, '사용자 ID', user.id || '확인 불가');
        addValue(details, '현재 기기', device.label || '이름 확인 불가');
        addValue(details, '기기 ID', device.id || '확인 불가');
        addValue(details, '기기 보안 상태', `${deviceStatusLabels[device.status] || '확인 불가'} (${device.status || 'unknown'})`);
        addValue(details, '로그인 세션 ID', session.id || '확인 불가');
        addValue(details, '세션 상태', `${sessionStatusLabels[session.status] || '확인 불가'} (${session.status || 'unknown'})`);
        section.append(details);
      });

      addResource('내 기기 목록', devices, (section, data) => {
        if (!Array.isArray(data)) {
          addLine(section, 'p', '확인 불가: 기기 목록 자료가 계약과 다릅니다.');
          return;
        }
        if (data.length === 0) {
          addLine(section, 'p', '등록된 기기가 없습니다.');
          return;
        }
        const list = document.createElement('ul');
        for (const device of data) {
          const item = document.createElement('li');
          item.textContent = `${device.label || '이름 확인 불가'} · ID ${device.id || '확인 불가'} · ${deviceStatusLabels[device.status] || '확인 불가'} (${device.status || 'unknown'})`;
          list.append(item);
        }
        section.append(list);
      });

      addResource('내 세션 목록', sessions, (section, data) => {
        if (!Array.isArray(data)) {
          addLine(section, 'p', '확인 불가: 세션 목록 자료가 계약과 다릅니다.');
          return;
        }
        if (data.length === 0) {
          addLine(section, 'p', '현재 확인된 세션이 없습니다.');
          return;
        }
        const list = document.createElement('ul');
        for (const session of data) {
          const item = document.createElement('li');
          item.textContent = `세션 ID ${session.id || '확인 불가'} · ${sessionStatusLabels[session.status] || '확인 불가'} (${session.status || 'unknown'})`;
          list.append(item);
        }
        section.append(list);
      });

      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = '업무 앱 접근 판정';
      root.append(heading);

      const addLine = (tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        root.append(node);
      };
      const targetAppId = data?.appId ?? appId;
      if (targetAppId != null && targetAppId !== '') {
        addLine('p', `업무 앱 ID: ${targetAppId}`);
      }

      if (status === 'idle') {
        addLine('p', '업무 앱을 선택해 접근을 요청하세요.');
      } else if (status === 'loading') {
        addLine('p', '판정 확인 중');
      } else if (status === 'error') {
        const detail = typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : '오류 내용을 확인할 수 없습니다.';
        addLine('p', `요청 실패: ${detail}`);
        addLine('p', '요청 실패는 접근 거부 판정이 아닙니다.');
      } else if (status === 'ok') {
        const decisionLabels = {
          allow: '허용',
          deny: '거부',
          challenge: '추가 확인 필요',
          unknown: '확인 불가',
        };
        const rawDecision = typeof data?.decision === 'string' && data.decision.length > 0
          ? data.decision
          : 'unknown';
        const displayDecision = Object.hasOwn(decisionLabels, rawDecision)
          ? rawDecision
          : 'unknown';
        const label = decisionLabels[displayDecision];
        addLine('p', `판정: ${label}(${displayDecision})`);

        if (rawDecision === 'allow') {
          addLine('p', '정책상 접근 허용이며 실제 앱 접속 성공을 보장하지 않습니다.');
        } else if (rawDecision === 'challenge') {
          addLine('p', '이 앱이 추가 인증이나 확인 절차를 대신 수행하지 않습니다.');
        }

        const reason = typeof data?.reason === 'string' && data.reason.length > 0
          ? data.reason
          : '사유 정보 없음';
        const checkedAt = typeof data?.checkedAt === 'string' && data.checkedAt.length > 0
          ? data.checkedAt
          : '확인 불가';
        addLine('p', `판정 이유: ${reason}`);
        addLine('p', `판정 시각: ${checkedAt}`);
      } else {
        addLine('p', '확인 불가: 응답 상태를 확인할 수 없습니다.');
      }

      return root;
    },
    renderEvents({ status, data, error } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '접속 기록·XDR 경보');

      const heading = document.createElement('h3');
      heading.textContent = '내 접속 기록·XDR 경보';
      root.append(heading);

      const addLine = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.append(node);
        return node;
      };
      const errorMessage = typeof error?.message === 'string' && error.message.length > 0
        ? error.message
        : '오류 내용을 확인할 수 없습니다.';

      if (status === 'loading') {
        const message = addLine(root, 'p', '기록을 불러오는 중입니다.');
        message.setAttribute('role', 'status');
        return root;
      }
      if (status === 'error') {
        const mismatch = error?.code === 'CONTRACT_MISMATCH';
        const message = mismatch
          ? `확인 불가: 기록 응답 형식이 계약과 다릅니다. ${errorMessage}`
          : `기록을 불러오지 못했습니다: ${errorMessage}`;
        const notice = addLine(root, 'p', message);
        notice.setAttribute('role', 'alert');
        return root;
      }
      if (status !== 'ok') {
        const message = addLine(root, 'p', '확인 불가: 기록 응답 상태를 확인할 수 없습니다.');
        message.setAttribute('role', 'status');
        return root;
      }
      if (!Array.isArray(data)) {
        const message = addLine(root, 'p', '확인 불가: 기록 자료 형식이 계약과 다릅니다.');
        message.setAttribute('role', 'status');
        return root;
      }

      const events = [...data].sort((left, right) => {
        const leftTime = Date.parse(left?.at ?? '');
        const rightTime = Date.parse(right?.at ?? '');
        if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return rightTime - leftTime;
        return String(right?.at ?? '').localeCompare(String(left?.at ?? ''));
      });

      const kindLabels = { access: '접속 기록', xdr: 'XDR 경보' };
      const accessLabels = { allowed: '접근 허용', denied: '접근 거부', unknown: '확인 불가' };
      const sessionLabels = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const deviceLabels = { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' };
      const selectedFilters = { kind: 'all', appId: 'all', access: 'all' };
      const filterValues = {
        kind: (event) => String(event?.kind ?? 'unknown'),
        appId: (event) => event?.appId == null || event.appId === '' ? '' : String(event.appId),
        access: (event) => String(event?.state?.access ?? 'unknown'),
      };

      const filters = document.createElement('div');
      const addFilter = (name, field, labels = {}) => {
        const label = document.createElement('label');
        label.setAttribute('aria-label', name);
        addLine(label, 'span', name);

        const select = document.createElement('select');
        select.setAttribute('aria-label', name);
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '전체';
        select.append(allOption);

        const values = [...new Set(events.map(filterValues[field]))];
        for (const value of values) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value === ''
            ? '앱 ID 없음'
            : Object.hasOwn(labels, value) ? `${labels[value]} (${value})` : value;
          select.append(option);
        }
        select.value = 'all';
        select.addEventListener('change', () => {
          selectedFilters[field] = select.value;
          selectedEventId = null;
          renderRows();
        });
        label.append(select);
        filters.append(label);
      };

      addFilter('기록 종류', 'kind', kindLabels);
      addFilter('업무 앱', 'appId');
      addFilter('접속 상태', 'access', accessLabels);

      const results = document.createElement('div');
      const details = document.createElement('div');
      details.setAttribute('aria-live', 'polite');
      root.append(filters, results, details);

      let selectedEventId = null;
      const formatState = (labels, value) => {
        const code = typeof value === 'string' && value.length > 0 ? value : 'unknown';
        return `${Object.hasOwn(labels, code) ? labels[code] : '확인 불가'}(${code})`;
      };
      const appendEntries = (parent, title, entries) => {
        const section = document.createElement('section');
        addLine(section, 'h5', title);
        if (!Array.isArray(entries) || entries.length === 0) {
          addLine(section, 'p', '없음');
        } else {
          const entryList = document.createElement('ul');
          for (const entry of entries) {
            const item = document.createElement('li');
            item.textContent = `${String(entry?.id ?? 'ID 확인 불가')}: ${String(entry?.text ?? '')}`;
            entryList.append(item);
          }
          section.append(entryList);
        }
        parent.append(section);
      };
      const createDetails = (event) => {
        const section = document.createElement('section');
        const eventId = String(event?.id ?? '확인 불가');
        section.setAttribute('data-student-event-detail', eventId);
        section.setAttribute('aria-label', `${eventId} 상세`);
        addLine(section, 'h4', `${eventId} 상세`);
        addLine(section, 'p', `사건 ID: ${eventId}`);
        addLine(section, 'p', `업무 앱 ID: ${event?.appId == null || event.appId === '' ? '앱을 확인할 수 없음' : String(event.appId)}`);
        appendEntries(section, '근거', event?.evidence);
        appendEntries(section, '규칙', event?.rules);
        addLine(section, 'p', `접근 상태: ${formatState(accessLabels, event?.state?.access)}`);
        addLine(section, 'p', `세션 상태: ${formatState(sessionLabels, event?.state?.session)}`);
        addLine(section, 'p', `기기 보안 상태: ${formatState(deviceLabels, event?.state?.device)}`);

        const supportedActions = Array.isArray(event?.supportedActions) ? event.supportedActions : [];
        if (supportedActions.length > 0) {
          addLine(section, 'p', '아직 지원하지 않는 조치입니다. 아래 버튼은 비활성 상태이며 요청을 전송하지 않습니다.');
          const actionList = document.createElement('ul');
          for (const action of supportedActions) {
            const item = document.createElement('li');
            const button = document.createElement('button');
            button.setAttribute('type', 'button');
            button.disabled = true;
            button.textContent = `${String(action)} 미지원`;
            item.append(button);
            actionList.append(item);
          }
          section.append(actionList);
        }
        return section;
      };

      const renderRows = () => {
        const visibleEvents = events.filter((event) =>
          Object.entries(selectedFilters).every(([field, selected]) =>
            selected === 'all' || filterValues[field](event) === selected,
          ),
        );
        results.replaceChildren();
        details.replaceChildren();

        if (visibleEvents.length === 0) {
          addLine(results, 'p', events.length === 0 ? '표시할 기록이 없습니다.' : '선택한 조건에 맞는 기록이 없습니다.');
          return;
        }

        const list = document.createElement('ul');
        for (const event of visibleEvents) {
          const row = document.createElement('li');
          const eventId = String(event?.id ?? '확인 불가');
          row.setAttribute('data-student-event-id', eventId);
          addLine(row, 'h4', `기록 ID: ${eventId}`);
          addLine(row, 'p', `시각: ${String(event?.at ?? '확인 불가')}`);
          const kind = String(event?.kind ?? 'unknown');
          addLine(row, 'p', `종류: ${Object.hasOwn(kindLabels, kind) ? kindLabels[kind] : '확인 불가'} (${kind})`);
          addLine(row, 'p', `업무 앱: ${event?.appId == null || event.appId === '' ? '앱을 확인할 수 없음' : String(event.appId)}`);
          addLine(row, 'p', `요약: ${String(event?.summary ?? '')}`);

          const button = document.createElement('button');
          button.setAttribute('type', 'button');
          button.setAttribute('aria-label', `${eventId} 상세`);
          button.setAttribute('aria-expanded', selectedEventId === eventId ? 'true' : 'false');
          button.textContent = `${eventId} 상세`;
          button.addEventListener('click', () => {
            selectedEventId = selectedEventId === eventId ? null : eventId;
            renderRows();
          });
          row.append(button);
          list.append(row);
        }
        results.append(list);

        const selectedEvent = visibleEvents.find((event) => String(event?.id ?? '확인 불가') === selectedEventId);
        if (selectedEvent) details.append(createDetails(selectedEvent));
      };

      renderRows();
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '기기·세션·알림·도움정보 상태');

      const addLine = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.append(node);
        return node;
      };
      const addValue = (list, label, value) => {
        addLine(list, 'dt', label);
        addLine(list, 'dd', value);
      };
      const textValue = (value) => typeof value === 'string' && value.length > 0 ? value : '확인 불가';
      const modeLabels = {
        connected: '연결됨',
        demo: '예제 데이터 · 실제 연결 아님',
        disconnected: '연결 없음',
        unknown: '연결 상태 확인 불가',
      };
      const deviceLabels = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionLabels = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };
      const modeCode = typeof mode === 'string' && mode.length > 0 ? mode : 'unknown';
      addLine(root, 'h3', '기기·세션·알림·도움정보 상태');
      addLine(root, 'p', `데이터 모드: ${modeLabels[modeCode] || '확인 불가'} (${modeCode})`);

      const addResource = (title, resource, failureText, timeoutText, retryText, renderData) => {
        const section = document.createElement('section');
        addLine(section, 'h4', title);

        if (resource?.status === 'loading') {
          const message = addLine(section, 'p', `${title} 불러오는 중입니다.`);
          message.setAttribute('role', 'status');
        } else if (resource?.status === 'error') {
          const detail = textValue(resource.error?.message);
          const timeoutCodes = ['TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT', 'WB_CLCO_TIMEOUT'];
          const isTimeout = timeoutCodes.includes(resource.error?.code);
          const message = addLine(section, 'p', `${isTimeout ? timeoutText : failureText}: ${detail}`);
          message.setAttribute('role', 'alert');
          addLine(section, 'p', retryText);
        } else if (resource?.status === 'ok') {
          renderData(section, resource.data);
        } else if (!resource || resource.status === 'idle') {
          const message = addLine(section, 'p', `${title} 조회는 아직 시작되지 않았습니다.`);
          message.setAttribute('role', 'status');
        } else {
          const message = addLine(section, 'p', `확인 불가: ${title} 상태를 확인할 수 없습니다.`);
          message.setAttribute('role', 'status');
        }

        root.append(section);
        return section;
      };

      addResource(
        '내 기기 목록',
        devices,
        '기기 목록을 불러오지 못했습니다',
        '기기 목록 조회 시간이 초과됐습니다',
        '다시 시도하려면 화면 위쪽 「다시 불러오기」를 직접 누르세요.',
        (section, data) => {
          if (!Array.isArray(data)) {
            addLine(section, 'p', '확인 불가: 기기 목록 자료 형식이 응답 계약과 다릅니다.');
          } else if (data.length === 0) {
            addLine(section, 'p', '등록된 기기가 없습니다.');
          } else {
            const list = document.createElement('ul');
            for (const device of data) {
              const status = typeof device?.status === 'string' && device.status.length > 0 ? device.status : 'unknown';
              const label = deviceLabels[status] || '확인 불가';
              addLine(list, 'li', `기기: ${textValue(device?.label)} · ID ${textValue(device?.id)} · 보안 상태 ${label} (${status})`);
            }
            section.append(list);
          }
        },
      );

      const sessionSection = addResource(
        '내 세션 목록',
        sessions,
        '세션 목록을 불러오지 못했습니다',
        '세션 목록 조회 시간이 초과됐습니다',
        '다시 시도하려면 화면 위쪽 「다시 불러오기」를 직접 누르세요.',
        (section, data) => {
          addLine(section, 'p', '세션 조회 범위는 현재 검증된 연결 한 개이며, 과거 세션 목록이 아닙니다.');
          if (!Array.isArray(data)) {
            addLine(section, 'p', '확인 불가: 세션 목록 자료 형식이 응답 계약과 다릅니다.');
          } else if (data.length === 0) {
            addLine(section, 'p', '현재 연결된 세션이 없습니다.');
          } else {
            const list = document.createElement('ul');
            for (const session of data) {
              const status = typeof session?.status === 'string' && session.status.length > 0 ? session.status : 'unknown';
              const label = sessionLabels[status] || '확인 불가';
              addLine(list, 'li', `세션 ID ${textValue(session?.id)} · 상태 ${label} (${status})`);
            }
            section.append(list);
          }
        },
      );
      if (sessions?.status !== 'ok') {
        addLine(sessionSection, 'p', '세션 조회 범위는 현재 검증된 연결 한 개이며, 과거 세션 목록이 아닙니다.');
      }

      const notificationSection = document.createElement('section');
      addLine(notificationSection, 'h4', '주의 알림');
      if (!Array.isArray(notifications)) {
        addLine(notificationSection, 'p', '확인 불가: 알림 자료 형식을 확인할 수 없습니다.');
      } else if (notifications.length === 0) {
        addLine(notificationSection, 'p', '주의할 알림이 없습니다.');
      } else {
        const list = document.createElement('ul');
        for (const notification of notifications) {
          const item = document.createElement('li');
          addLine(item, 'p', `자료(resource): ${textValue(notification?.resource)}`);
          addLine(item, 'p', `코드(code): ${textValue(notification?.code)}`);
          addLine(item, 'p', `메시지(message): ${textValue(notification?.message)}`);
          list.append(item);
        }
        notificationSection.append(list);
      }
      root.append(notificationSection);

      addResource(
        '도움정보 진단',
        diagnostics,
        '진단 정보를 불러오지 못했습니다',
        '진단 정보 조회 시간이 초과됐습니다',
        '다시 시도하려면 제공 화면의 「도움정보 불러오기」를 직접 누르세요.',
        (section, data) => {
          const safeData = {
            requestId: textValue(data?.requestId),
            component: textValue(data?.component),
            version: textValue(data?.version),
            checkedAt: textValue(data?.checkedAt),
            engine: {
              mode: textValue(data?.engine?.mode),
              code: textValue(data?.engine?.code),
            },
          };
          const details = document.createElement('dl');
          addValue(details, 'requestId', safeData.requestId);
          addValue(details, 'component', safeData.component);
          addValue(details, 'version', safeData.version);
          addValue(details, 'checkedAt', safeData.checkedAt);
          addValue(details, 'engine.mode', safeData.engine.mode);
          addValue(details, 'engine.code', safeData.engine.code);
          section.append(details);
          addLine(section, 'p', '도움 요청에 사용할 수 있는 비밀 없는 진단 정보입니다. 복사해도 자동 전송되지 않습니다.');

          const copyButton = document.createElement('button');
          copyButton.setAttribute('type', 'button');
          copyButton.textContent = '도움정보 복사';
          const copyStatus = addLine(section, 'p', '');
          copyStatus.setAttribute('role', 'status');
          copyButton.addEventListener('click', async () => {
            try {
              if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
              await navigator.clipboard.writeText(JSON.stringify(safeData, null, 2));
              copyStatus.textContent = '비밀 없는 진단 정보를 클립보드에 복사했습니다. 외부로 자동 전송되지 않았습니다.';
            } catch {
              copyStatus.textContent = '도움정보를 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요.';
            }
          });
          section.append(copyButton);
        },
      );

      return root;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection({ status, mode, data, error, checkedAt } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', 'AI 연결 점검 결과');
      const addLine = (tag, text, role) => {
        const node = document.createElement(tag);
        node.textContent = text;
        if (role) node.setAttribute('role', role);
        root.append(node);
        return node;
      };
      const modes = {
        connected: '연결됨',
        demo: '예제 응답(demo) · 실제 연결 아님',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };
      const heading = document.createElement('h3');
      heading.textContent = 'AI 연결 점검';
      root.append(heading);
      addLine('p', `데이터 모드: ${modes[mode] || '확인 불가'}`);

      if (status === 'idle') {
        addLine('p', 'AI 연결 점검 전입니다. 자동 점검은 실행하지 않습니다.');
      } else if (status === 'loading') {
        addLine('p', 'AI 연결 점검 중입니다.', 'status');
      } else if (status === 'ok') {
        const authorization = data?.audienceAuthorization;
        const authorizationLabels = {
          test: '시험 연결 점검(test)',
          verified: '앱 권한 확인 후 점검(verified)',
        };
        if (data?.transportChecked !== true || !Object.hasOwn(authorizationLabels, authorization)
          || !Number.isInteger(data.modelCount) || data.modelCount < 0 || data.modelCount > 10000
          || typeof checkedAt !== 'string' || checkedAt.length === 0) {
          addLine('p', '확인 불가: 연결 점검 응답이 입력 계약을 충족하지 않습니다.', 'status');
        } else {
          addLine('p', authorizationLabels[authorization]);
          addLine('p', `응답 모델 수: ${data.modelCount}`);
          addLine('p', `점검 시각: ${checkedAt}`);
          addLine('p', 'AI 연결만 점검했습니다. 사건 설명은 아직 실행하지 않았습니다.');
        }
      } else if (status === 'error') {
        const recovery = {
          ON_AI_PROVISIONING_PENDING: '권한 준비 중입니다. 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
          ON_AI_AUTHORIZATION_CHANGED: '점검 중 권한이 변경됐습니다. 담당자에게 현재 계정 권한을 확인하세요.',
          SUBJECT_SCOPE_UNVERIFIED: '현재 계정의 앱 권한을 확인할 수 없습니다. 담당자에게 계정 연결을 확인하세요.',
          WB_CLCO_AUTH_REQUIRED: '인증이 필요합니다. 계정 연결을 다시 확인하고 담당자에게 확인을 요청하세요.',
          WB_CLCO_ACCESS_BLOCKED: '앱 접근이 제한됐습니다. 담당자에게 계정과 앱 권한을 확인하세요.',
          WB_CLCO_COHORT_BUDGET_EXHAUSTED: '수업 사용량이 소진됐습니다. 담당자에게 확인하세요.',
          WB_CLCO_LIMIT_REACHED: '이용 한도에 도달했습니다. 담당자에게 확인하세요.',
          WB_CLCO_SESSION_CLOSED: '현재 이용 시간이 아닙니다. 정해진 이용 시간을 확인하세요.',
          WB_CLCO_RATE_LIMITED: '요청이 제한됐습니다. 잠시 뒤 직접 다시 점검하세요.',
          WB_CLCO_TIMEOUT: '요청 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
          REQUEST_TIMEOUT: '서버 응답 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
          ENGINE_TIMEOUT: '서버 확인 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
          TIMEOUT: '요청 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
          WB_CLCO_CANCELLED: '점검이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다.',
          CANCELLED: '점검이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다.',
          REQUEST_CANCELLED: '점검이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다.',
          MODEL_NOT_CONFIGURED: '사용할 모델이 설정되지 않았습니다. 담당자에게 모델 설정을 확인하세요.',
          ON_AI_MODEL_LIST_EMPTY: '사용할 수 있는 모델이 없습니다. 담당자에게 모델 허용 설정을 확인하세요.',
          ON_AI_INVALID_INPUT: '점검 입력을 확인할 수 없습니다. 담당자에게 확인하세요.',
          ON_AI_INVALID_OUTPUT: '점검 응답을 확인할 수 없습니다. 담당자에게 확인하세요.',
          AI_REQUEST_UNVERIFIED: '연결 또는 응답을 확인할 수 없습니다. 잠시 뒤 직접 다시 점검하거나 담당자에게 확인하세요.',
        };
        const knownCode = Object.hasOwn(recovery, error?.code);
        const code = knownCode ? error.code : 'AI_REQUEST_UNVERIFIED';
        const message = knownCode && typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : '연결 또는 응답을 확인할 수 없습니다.';
        addLine('p', 'AI 연결 점검 실패', 'alert');
        addLine('p', `오류 코드: ${code}`);
        addLine('p', `오류 내용: ${message}`);
        addLine('p', recovery[code]);
        addLine('p', '이 실패는 실제 사건 설명 결과가 아닙니다. 자동 재시도하지 않았습니다. 필요하면 「현재 API 연결 점검」을 직접 누르세요.');
      } else {
        addLine('p', '확인 불가: AI 연결 점검 상태를 확인할 수 없습니다.', 'status');
      }
      if (status === 'idle') addLine('p', '점검하려면 제공 화면의 「현재 API 연결 점검」을 직접 누르세요.');
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '선택한 보안 사건의 AI 설명');
      const addLine = (tag, text, role) => {
        const node = document.createElement(tag);
        node.textContent = text;
        if (role) node.setAttribute('role', role);
        root.append(node);
      };
      const heading = document.createElement('h3');
      heading.textContent = 'AI 사건 설명';
      root.append(heading);

      if (explanation?.status === 'idle') {
        addLine('p', '아직 사건 설명을 요청하지 않았습니다.', 'status');
      } else if (explanation?.status === 'loading') {
        addLine('p', '선택한 사건의 AI 설명을 요청 중입니다.', 'status');
      } else if (explanation?.status === 'ok') {
        const eventId = typeof event?.id === 'string' && event.id.length > 0 ? event.id : null;
        const summary = typeof explanation.data?.summary === 'string' ? explanation.data.summary : null;
        if (eventId && summary !== null) {
          root.setAttribute('data-student-explanation-event', eventId);
          addLine('p', `사건 ID: ${eventId}`);
          addLine('p', `AI 설명: ${summary}`);
        } else {
          addLine('p', '확인 불가: 사건 ID 또는 AI 설명 요약이 응답 계약과 다릅니다.', 'status');
        }
      } else if (explanation?.status === 'error') {
        const code = typeof explanation.error?.code === 'string' ? explanation.error.code : 'AI_REQUEST_UNVERIFIED';
        const message = typeof explanation.error?.message === 'string' && explanation.error.message.length > 0
          ? explanation.error.message
          : '안전한 오류 메시지를 확인할 수 없습니다.';
        addLine('p', 'AI 사건 설명 요청 실패', 'alert');
        addLine('p', `오류 코드: ${code}`);
        addLine('p', `오류 내용: ${message}`);
        addLine('p', '보안 기록은 변경되지 않았습니다.');
      } else {
        addLine('p', '확인 불가: 사건 설명 상태를 확인할 수 없습니다.', 'status');
      }
      return root;
    },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
