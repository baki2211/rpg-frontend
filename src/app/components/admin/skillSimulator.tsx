'use client';

import React, { useState, useEffect } from 'react';
import './admin.css';
import { api } from '../../../services/apiClient';

interface StatDefinition {
  id: number;
  internalName: string;
  displayName: string;
  category: string;
  defaultValue: number;
  maxValue: number;
  minValue: number;
}

interface Skill {
  id: number;
  name: string;
  basePower: number;
  scalingStats: string[];
  target: string;
  branch: { name: string };
  type: { name: string };
  aetherCost: number;
}

interface Character {
  id: number;
  name: string;
  stats: Record<string, number>;
  rank: number;
}

interface SimulationResult {
  baseImpact: number;
  skillMultiplier: number;
  branchMultiplier: number;
  poorOutput: number;
  standardOutput: number;
  criticalOutput: number;
  finalOutput?: number;
  rollOutcome?: string;
}

const SkillSimulator: React.FC = () => {
  const [statDefinitions, setStatDefinitions] = useState<StatDefinition[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation state
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [customStats, setCustomStats] = useState<Record<string, number>>({});
  const [skillUses, setSkillUses] = useState(0);
  const [branchUses, setBranchUses] = useState(0);
  const [useCustomStats, setUseCustomStats] = useState(false);
  
  // Results
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [combatResults, setCombatResults] = useState<{
    playerA: number;
    playerB: number;
    winner: string;
    damage: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, skillsResponse, charactersResponse] = await Promise.all([
        api.get('/stat-definitions/categories?activeOnly=true'),
        api.get('/skills'),
        api.get('/characters/all')
      ]);

      // Flatten stat definitions from categories
      const statsData = statsResponse.data as { primary_stat: StatDefinition[], resource: StatDefinition[], scaling_stat: StatDefinition[] };
      const allStats = [
        ...statsData.primary_stat,
        ...statsData.resource,
        ...statsData.scaling_stat
      ];
      setStatDefinitions(allStats);
      setSkills(skillsResponse.data as Skill[]);
      setCharacters(charactersResponse.data as Character[]);

      // Initialize custom stats with default values
      const initialStats: Record<string, number> = {};
      statsData.primary_stat.forEach((stat: StatDefinition) => {
        initialStats[stat.internalName] = stat.defaultValue;
      });
      setCustomStats(initialStats);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load simulation data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSkillRankMultiplier = (uses: number): number => {
    if (uses < 20) return 1.0;
    if (uses < 35) return 1.3;
    if (uses < 60) return 1.7;
    if (uses < 100) return 2.2;
    return 2.8;
  };

  const calculateBranchRankMultiplier = (uses: number): number => {
    if (uses < 75) return 1.0;
    if (uses < 150) return 1.05;
    if (uses < 250) return 1.1;
    if (uses < 375) return 1.15;
    if (uses < 525) return 1.2;
    if (uses < 700) return 1.25;
    if (uses < 900) return 1.3;
    if (uses < 1125) return 1.35;
    if (uses < 1375) return 1.4;
    return 1.5;
  };

  const calculateImpact = (skill: Skill, stats: Record<string, number>): number => {
    let impact = skill.basePower;

    if (skill.scalingStats && skill.scalingStats.length > 0) {
      const statValues = skill.scalingStats.map(stat => ({
        stat,
        value: stats[stat] || 0
      }));

      // Sort by value descending for weight assignment
      statValues.sort((a, b) => b.value - a.value);

      // Apply weights based on number of stats
      let weights: number[];
      switch (statValues.length) {
        case 1:
          weights = [1.0];
          break;
        case 2:
          weights = [0.7, 0.3];
          break;
        case 3:
        default:
          weights = [0.6, 0.25, 0.15];
          break;
      }

      // Apply weighted contributions
      for (let i = 0; i < Math.min(statValues.length, weights.length); i++) {
        const statContribution = statValues[i].value * weights[i];
        impact += Math.floor(statContribution);
      }
    }

    return impact;
  };

  const runSimulation = () => {
    if (!selectedSkill) {
      setError('Please select a skill');
      return;
    }

    const skill = skills.find(s => s.id === selectedSkill);
    if (!skill) {
      setError('Skill not found');
      return;
    }

    let stats: Record<string, number>;
    if (useCustomStats) {
      stats = customStats;
    } else if (selectedCharacter) {
      const character = characters.find(c => c.id === selectedCharacter);
      if (!character) {
        setError('Character not found');
        return;
      }
      stats = character.stats;
    } else {
      setError('Please select a character or use custom stats');
      return;
    }

    // Calculate base impact
    const baseImpact = calculateImpact(skill, stats);

    // Calculate multipliers
    const skillMultiplier = calculateSkillRankMultiplier(skillUses);
    const branchMultiplier = calculateBranchRankMultiplier(branchUses);

    // Calculate outputs for different roll outcomes
    const baseOutput = baseImpact * (skillMultiplier + branchMultiplier);
    const poorOutput = Math.floor(baseOutput * 0.6);
    const standardOutput = Math.floor(baseOutput * 1.0);
    const criticalOutput = Math.floor(baseOutput * 1.4);

    setSimulationResult({
      baseImpact,
      skillMultiplier,
      branchMultiplier,
      poorOutput,
      standardOutput,
      criticalOutput
    });

    setError(null);
  };

  const rollRandomOutcome = () => {
    if (!simulationResult) {
      runSimulation();
      return;
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    let outcome: string;
    let finalOutput: number;

    if (roll <= 3) {
      outcome = `Poor Success (rolled ${roll})`;
      finalOutput = simulationResult.poorOutput;
    } else if (roll <= 17) {
      outcome = `Standard Success (rolled ${roll})`;
      finalOutput = simulationResult.standardOutput;
    } else {
      outcome = `Critical Success (rolled ${roll})`;
      finalOutput = simulationResult.criticalOutput;
    }

    setSimulationResult({
      ...simulationResult,
      finalOutput,
      rollOutcome: outcome
    });
  };

  const simulateCombat = () => {
    if (!simulationResult) {
      setError('Please run a simulation first');
      return;
    }

    // Roll for both players
    const rollA = Math.floor(Math.random() * 20) + 1;
    const rollB = Math.floor(Math.random() * 20) + 1;

    const getOutput = (roll: number) => {
      if (roll <= 3) return simulationResult.poorOutput;
      if (roll <= 17) return simulationResult.standardOutput;
      return simulationResult.criticalOutput;
    };

    const playerA = getOutput(rollA);
    const playerB = getOutput(rollB);

    let winner: string;
    let damage: number;

    if (playerA > playerB) {
      winner = 'Player A';
      damage = playerA - playerB;
    } else if (playerB > playerA) {
      winner = 'Player B';
      damage = playerB - playerA;
    } else {
      winner = 'Tie';
      damage = 0;
    }

    setCombatResults({
      playerA,
      playerB,
      winner,
      damage
    });
  };

  const handleCustomStatChange = (statName: string, value: number) => {
    setCustomStats(prev => ({
      ...prev,
      [statName]: value
    }));
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">Loading simulator data...</div>
      </div>
    );
  }

  const primaryStats = statDefinitions.filter(stat => stat.category === 'primary_stat');
  const selectedSkillObj = skills.find(s => s.id === selectedSkill);

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Skill Testing Simulator</h1>
          <p>Test and analyze skill calculations with real game data</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="simulator-grid">
          {/* Character/Stats Configuration */}
          <div className="simulator-card">
            <h3>Character Configuration</h3>
            
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  checked={!useCustomStats}
                  onChange={() => setUseCustomStats(false)}
                />
                Use Existing Character
              </label>
              <label>
                <input
                  type="radio"
                  checked={useCustomStats}
                  onChange={() => setUseCustomStats(true)}
                />
                Use Custom Stats
              </label>
            </div>

            {!useCustomStats ? (
              <div className="form-group">
                <label>Select Character:</label>
                <select
                  value={selectedCharacter || ''}
                  onChange={(e) => setSelectedCharacter(Number(e.target.value) || null)}
                >
                  <option value="">Choose a character...</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>
                      {char.name} (Rank {char.rank})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="custom-stats-grid">
                {primaryStats.map(stat => (
                  <div key={stat.internalName} className="form-group">
                    <label>{stat.displayName}:</label>
                    <input
                      type="number"
                      min={stat.minValue}
                      max={stat.maxValue}
                      value={customStats[stat.internalName] || stat.defaultValue}
                      onChange={(e) => handleCustomStatChange(stat.internalName, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skill Configuration */}
          <div className="simulator-card">
            <h3>Skill Configuration</h3>
            
            <div className="form-group">
              <label>Select Skill:</label>
              <select
                value={selectedSkill || ''}
                onChange={(e) => setSelectedSkill(Number(e.target.value) || null)}
              >
                <option value="">Choose a skill...</option>
                {skills.map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name} (Base: {skill.basePower}, Type: {skill.type?.name})
                  </option>
                ))}
              </select>
            </div>

            {selectedSkillObj && (
              <div className="skill-info">
                <p><strong>Base Power:</strong> {selectedSkillObj.basePower}</p>
                <p><strong>Scaling Stats:</strong> {selectedSkillObj.scalingStats?.join(', ') || 'None'}</p>
                <p><strong>Target:</strong> {selectedSkillObj.target}</p>
                <p><strong>Aether Cost:</strong> {selectedSkillObj.aetherCost}</p>
                <p><strong>Branch:</strong> {selectedSkillObj.branch?.name}</p>
              </div>
            )}

            <div className="form-group">
              <label>Skill Uses (for rank calculation):</label>
              <input
                type="number"
                min="0"
                value={skillUses}
                onChange={(e) => setSkillUses(Number(e.target.value))}
              />
              <small>Rank: {skillUses < 20 ? 'I' : skillUses < 35 ? 'II' : skillUses < 60 ? 'III' : skillUses < 100 ? 'IV' : 'V'}</small>
            </div>

            <div className="form-group">
              <label>Branch Uses (for branch rank calculation):</label>
              <input
                type="number"
                min="0"
                value={branchUses}
                onChange={(e) => setBranchUses(Number(e.target.value))}
              />
              <small>Rank: {
                branchUses < 75 ? 'I' : branchUses < 150 ? 'II' : branchUses < 250 ? 'III' : 
                branchUses < 375 ? 'IV' : branchUses < 525 ? 'V' : branchUses < 700 ? 'VI' :
                branchUses < 900 ? 'VII' : branchUses < 1125 ? 'VIII' : branchUses < 1375 ? 'IX' : 'X'
              }</small>
            </div>
          </div>

          {/* Simulation Results */}
          <div className="simulator-card result-card">
            <h3>Simulation Results</h3>
            
            <div className="simulation-controls">
              <button onClick={runSimulation} className="btn btn-primary">
                Calculate Skill Output
              </button>
              <button onClick={rollRandomOutcome} className="btn btn-secondary">
                Roll Random Outcome
              </button>
            </div>

            {simulationResult && (
              <div className="results-grid">
                <div className="result-item">
                  <h4>Base Impact</h4>
                  <div className="value">{simulationResult.baseImpact}</div>
                </div>
                <div className="result-item">
                  <h4>Skill Multiplier</h4>
                  <div className="value">{simulationResult.skillMultiplier.toFixed(2)}×</div>
                </div>
                <div className="result-item">
                  <h4>Branch Multiplier</h4>
                  <div className="value">{simulationResult.branchMultiplier.toFixed(2)}×</div>
                </div>
                <div className="result-item">
                  <h4>Poor Success (1-3)</h4>
                  <div className="value">{simulationResult.poorOutput}</div>
                </div>
                <div className="result-item">
                  <h4>Standard Success (4-17)</h4>
                  <div className="value">{simulationResult.standardOutput}</div>
                </div>
                <div className="result-item">
                  <h4>Critical Success (18-20)</h4>
                  <div className="value">{simulationResult.criticalOutput}</div>
                </div>
              </div>
            )}

            {simulationResult?.finalOutput && (
              <div className="random-result">
                <h4>{simulationResult.rollOutcome}</h4>
                <div className="final-output">Final Output: {simulationResult.finalOutput}</div>
              </div>
            )}
          </div>

          {/* Combat Simulator */}
          <div className="simulator-card combat-card">
            <h3>Combat Simulator</h3>
            
            <button onClick={simulateCombat} className="btn btn-primary">
              Simulate Combat
            </button>

            {combatResults && (
              <div className="combat-results">
                <div className="combat-grid">
                  <div className="player-result">
                    <h4>Player A</h4>
                    <div className="output">{combatResults.playerA}</div>
                  </div>
                  <div className="vs">VS</div>
                  <div className="player-result">
                    <h4>Player B</h4>
                    <div className="output">{combatResults.playerB}</div>
                  </div>
                </div>
                <div className="combat-outcome">
                  {combatResults.winner === 'Tie' ? (
                    <p>Perfect Tie! No damage dealt.</p>
                  ) : (
                    <p>{combatResults.winner} wins! Damage: {combatResults.damage}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillSimulator; 