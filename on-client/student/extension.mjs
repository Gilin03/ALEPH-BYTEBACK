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
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
