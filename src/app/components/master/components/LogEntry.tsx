import React from 'react';
import type { EngineLog } from '../../../../services/engineLogsService';

interface LogEntryProps {
  log: EngineLog;
}

export const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  const isClash = log.type === 'clash';
  return (
    <div className={`log-entry ${log.type}`}>
      <div className="log-header">
        <div className="log-timestamp">
          {log.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
        <div className={`log-type-badge ${log.type}`}>
          {log.type.replace('_', ' ').toUpperCase()}
        </div>
      </div>
      <div className="log-content">
        <div className={isClash ? 'clash-content' : 'regular-content'}>
          {isClash ? (
            <>
              <div className="log-main-line">
                <span className="log-actor">{log.actor}</span>
                <span className="clash-vs">VS</span>
                <span className="log-actor">{log.target}</span>
              </div>
              {log.skill && (
                <div className="log-action">
                  <strong>Skills:</strong> {log.skill}
                </div>
              )}
            </>
          ) : (
            <div className="log-main-line">
              <span className="log-actor">{log.actor}</span>
              {log.skill && (
                <span className="log-action">
                  used <span className="log-skill">{log.skill}</span>
                </span>
              )}
              {log.target && log.target !== log.actor && (
                <span className="log-target">on {log.target}</span>
              )}
            </div>
          )}

          {log.effects && log.effects.length > 0 && (
            <div className="log-effects">
              {log.effects.map((effect, index) => (
                <span key={index} className="effect-tag">
                  {effect}
                </span>
              ))}
            </div>
          )}

          {!!log.damage && (
            <div className="log-damage">
              <span className="damage-label">
                {isClash ? 'Damage Dealt:' : 'Result:'}
              </span>{' '}
              {log.damage}
            </div>
          )}

          <div className="log-details">{log.details}</div>
        </div>
      </div>
    </div>
  );
};
