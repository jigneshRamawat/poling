import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PollPanel from './components/PollPanel';
import VoteConfirmation from './components/VoteConfirmation';
import OptionalNameForm from './components/OptionalNameForm';
import LiveResults from './components/LiveResults';
import Footer from './components/Footer';

import {
  fetchPollInfo,
  fetchResults,
  checkVoterStatus,
  submitVote,
  submitOptionalName,
} from './services/api';
import { getOrCreateVoterId, resetVoterId } from './services/voterId';
import { socket } from './services/socket';
import { playEvmBeep, toggleSound, isSoundEnabled } from './services/sound';

export default function App() {
  const [pollData, setPollData] = useState(null);
  const [voterId, setVoterId] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [recordedVote, setRecordedVote] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [resultsData, setResultsData] = useState({ totalVotes: 0, results: [] });
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [soundOn, setSoundOn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Voter ID and load initial Poll & Voting status
  const initialize = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const vid = getOrCreateVoterId();
      setVoterId(vid);

      // 1. Fetch Poll Info & Options
      const poll = await fetchPollInfo();
      setPollData(poll);

      // 2. Check if this voter has already voted
      const status = await checkVoterStatus(vid);
      if (status.hasVoted) {
        setHasVoted(true);
        setRecordedVote(status.vote);
        setSelectedOptionId(status.vote.optionId);

        // Fetch live results for returning voter
        const res = await fetchResults();
        setResultsData(res);
      }
    } catch (err) {
      console.error('Initialization error:', err);
      setErrorMessage(err.message || 'पोल डेटा लोड करने में समस्या आई।');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();

    // Socket.IO event listeners
    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    const onResultsUpdated = (latestResults) => {
      setResultsData(latestResults);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('poll:resultsUpdated', onResultsUpdated);

    // Sync sound setting
    setSoundOn(isSoundEnabled());

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('poll:resultsUpdated', onResultsUpdated);
    };
  }, [initialize]);

  // Handle immediate vote submission on button press
  const handleVote = async (option) => {
    if (hasVoted || isSubmittingVote || !pollData) return;

    // 1. Play authentic EVM beep tone
    playEvmBeep();

    // 2. Highlight selected option and illuminate red LED
    setSelectedOptionId(option.id);
    setIsSubmittingVote(true);
    setErrorMessage(null);

    try {
      // 3. Send vote to backend Express API
      const response = await submitVote({
        pollId: pollData.pollId,
        optionId: option.id,
        voterId,
      });

      // 4. Only after MongoDB confirms successful save:
      setHasVoted(true);
      setRecordedVote(response.vote);

      if (response.results) {
        setResultsData(response.results);
      } else {
        const freshResults = await fetchResults();
        setResultsData(freshResults);
      }
    } catch (err) {
      console.error('Vote submission error:', err);

      if (err.code === 'ALREADY_VOTED') {
        setHasVoted(true);
        setErrorMessage(err.message || 'आप इस ब्राउज़र से अपना वोट पहले ही दर्ज कर चुके हैं।');
        // Fetch results so user can view existing results
        try {
          const freshResults = await fetchResults();
          setResultsData(freshResults);
        } catch {
          // ignore
        }
      } else {
        setErrorMessage(err.message || 'वोट दर्ज करने में असमर्थ। कृपया पुनः प्रयास करें।');
        // Reset selection so user can retry
        setSelectedOptionId(null);
      }
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Handle optional name entry update
  const handleSaveName = async (name) => {
    if (!pollData || !voterId) return;
    setIsSavingName(true);
    try {
      const response = await submitOptionalName({
        pollId: pollData.pollId,
        voterId,
        optionalName: name,
      });

      setRecordedVote((prev) => ({
        ...prev,
        optionalName: response.optionalName,
      }));
    } finally {
      setIsSavingName(false);
    }
  };

  // Toggle sound
  const handleToggleSound = () => {
    const nextState = toggleSound();
    setSoundOn(nextState);
  };

  // Reset voter ID for developer / reviewer testing
  const handleResetVoter = () => {
    if (window.confirm('क्या आप परीक्षण के लिए अपनी ब्राउज़र वोटर आईडी रीसेट करना चाहते हैं? इससे आप नया वोट टेस्ट कर सकेंगे।')) {
      resetVoterId();
      setHasVoted(false);
      setRecordedVote(null);
      setSelectedOptionId(null);
      initialize();
    }
  };

  // Manual refresh results
  const handleRefreshResults = async () => {
    try {
      const fresh = await fetchResults();
      setResultsData(fresh);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  if (isLoading && !pollData) {
    return (
      <div className="app-loading-screen">
        <div className="evm-loading-card">
          <div className="evm-spinner"></div>
          <p className="loading-text">मतदान प्रणाली प्रारंभ हो रही है...</p>
          <span className="loading-sub">वार्ड नंबर 5 • इलेक्ट्रॉनिक वोटिंग टेस्ट</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" id="voting-app-root">
      <div className="app-wrapper">
        {/* 1. Header Section */}
        <Header soundOn={soundOn} onToggleSound={handleToggleSound} />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="global-error-banner" id="global-error-banner" role="alert">
            <div className="global-error-banner-header">
              <span className="error-icon">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            {!pollData && (
              <button
                type="button"
                className="global-error-retry-btn"
                onClick={initialize}
              >
                🔄 पुनः प्रयास करें (Retry)
              </button>
            )}
          </div>
        )}

        {/* 2. Main EVM Voting Panel */}
        <main className="main-content">
          <PollPanel
            options={pollData?.options || []}
            wardName={pollData?.wardName || 'वार्ड नंबर 5'}
            selectedOptionId={selectedOptionId}
            isSubmitting={isSubmittingVote}
            hasVoted={hasVoted}
            onVote={handleVote}
          />

          {/* 3. Post-Vote Flow: Confirmation & Optional Name */}
          {hasVoted && (
            <div className="post-vote-container" id="post-vote-section">
              <VoteConfirmation
                message={
                  errorMessage && errorMessage.includes('पहले ही')
                    ? errorMessage
                    : 'आपका वोट सफलतापूर्वक दर्ज हो गया है।'
                }
                selectedOptionName={recordedVote?.optionName}
                isExistingVote={Boolean(errorMessage && errorMessage.includes('पहले ही'))}
                timestamp={recordedVote?.createdAt}
              />

              <OptionalNameForm
                initialName={recordedVote?.optionalName || ''}
                onSaveName={handleSaveName}
                isSaving={isSavingName}
              />
            </div>
          )}

          {/* 4. Live Results Panel (Shown ONLY after voting has been recorded) */}
          {hasVoted && (
            <div className="results-wrapper" id="results-display-wrapper">
              <LiveResults
                results={resultsData?.results || []}
                totalVotes={resultsData?.totalVotes || 0}
                userVotedOptionId={recordedVote?.optionId}
                isLiveConnected={isSocketConnected}
                onRefresh={handleRefreshResults}
              />
            </div>
          )}
        </main>

        {/* 5. Footer and Legal Disclaimers */}
        <Footer onResetVoterId={handleResetVoter} />
      </div>
    </div>
  );
}
