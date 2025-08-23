/**
 * Human Validation Interface for Jarvish Research System
 * Mobile-first interface for advisor review and enrichment of AI research
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  SwipeableViews, 
  VoiceRecorder, 
  RichTextEditor,
  ConfidenceIndicator 
} from './components';

/**
 * MOBILE VALIDATION INTERFACE
 * Swipe-based review system for rapid research validation
 */
const MobileValidationInterface = () => {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    approved: 0,
    edited: 0,
    rejected: 0,
    timeSpent: 0
  });

  // Swipe gesture handlers
  const handleSwipe = useCallback((direction) => {
    const actions = {
      right: 'approve',
      left: 'needs-review',
      up: 'view-details',
      down: 'skip-for-later'
    };
    
    processAction(actions[direction], queue[currentIndex]);
  }, [currentIndex, queue]);

  // Process validation action
  const processAction = async (action, item) => {
    const timestamp = Date.now();
    
    switch(action) {
      case 'approve':
        await approveResearch(item);
        updateStats('approved');
        moveToNext();
        break;
        
      case 'needs-review':
        openDetailedReview(item);
        break;
        
      case 'view-details':
        expandResearchDetails(item);
        break;
        
      case 'skip-for-later':
        markForLaterReview(item);
        moveToNext();
        break;
    }
    
    // Track time spent
    trackTimeSpent(timestamp);
  };

  return (
    <div className="mobile-validation-container">
      {/* Header with progress -->*/}
      <ValidationHeader 
        progress={currentIndex}
        total={queue.length}
        stats={sessionStats}
      />
      
      {/* Swipeable research cards */}
      <SwipeableViews
        index={currentIndex}
        onSwipe={handleSwipe}
        enableMouseEvents
        resistance
      >
        {queue.map((item, index) => (
          <ResearchCard
            key={item.id}
            research={item}
            isActive={index === currentIndex}
          />
        ))}
      </SwipeableViews>
      
      {/* Quick action buttons */}
      <QuickActions 
        onApprove={() => processAction('approve', queue[currentIndex])}
        onEdit={() => processAction('needs-review', queue[currentIndex])}
        onReject={() => processAction('reject', queue[currentIndex])}
        onVoiceNote={() => addVoiceInsight(queue[currentIndex])}
      />
      
      {/* Batch processing option */}
      <BatchProcessor 
        items={queue}
        onBatchApprove={handleBatchApprove}
        similarityThreshold={0.85}
      />
    </div>
  );
};

/**
 * RESEARCH CARD COMPONENT
 * Displays research finding for quick review
 */
const ResearchCard = ({ research, isActive }) => {
  const [expanded, setExpanded] = useState(false);
  const [localEdits, setLocalEdits] = useState('');
  
  return (
    <div className={`research-card ${isActive ? 'active' : ''}`}>
      {/* Confidence indicator */}
      <ConfidenceIndicator 
        score={research.confidence}
        breakdown={research.confidenceBreakdown}
      />
      
      {/* Research headline */}
      <div className="headline">
        <h3>{research.headline}</h3>
        <span className="source">{research.primarySource}</span>
      </div>
      
      {/* Key points */}
      <div className="key-points">
        {research.keyPoints.map((point, idx) => (
          <div key={idx} className="point">
            <span className="bullet">•</span>
            <EditableText 
              text={point}
              onEdit={(newText) => handlePointEdit(idx, newText)}
            />
          </div>
        ))}
      </div>
      
      {/* Expandable details */}
      {expanded && (
        <ResearchDetails 
          research={research}
          onClose={() => setExpanded(false)}
        />
      )}
      
      {/* Quick context addition */}
      <QuickContext 
        onAddContext={(context) => enrichResearch(research.id, context)}
        suggestions={getContextSuggestions(research)}
      />
      
      {/* Source verification */}
      <SourceVerification 
        sources={research.sources}
        factChecks={research.factChecks}
      />
    </div>
  );
};

/**
 * DETAILED REVIEW INTERFACE
 * Full-screen editor for comprehensive research validation
 */
const DetailedReviewInterface = ({ research, onSave, onCancel }) => {
  const [editedContent, setEditedContent] = useState(research);
  const [advisorInsights, setAdvisorInsights] = useState('');
  const [localContext, setLocalContext] = useState('');
  const [validationNotes, setValidationNotes] = useState('');
  
  return (
    <div className="detailed-review">
      {/* Three-panel layout */}
      <div className="review-panels">
        {/* Left: Original research */}
        <div className="panel original">
          <h4>AI Research</h4>
          <ResearchDisplay data={research} highlighting={true} />
          <SourceList sources={research.sources} />
        </div>
        
        {/* Center: Editing area */}
        <div className="panel editing">
          <h4>Your Edits</h4>
          <RichTextEditor 
            content={editedContent}
            onChange={setEditedContent}
            suggestions={getAISuggestions(editedContent)}
            grammarCheck={true}
            complianceCheck={true}
          />
          
          {/* Advisor insights section */}
          <div className="advisor-insights">
            <h5>Add Your Insights</h5>
            <InsightCapture 
              onTextInsight={setAdvisorInsights}
              onVoiceInsight={processVoiceInsight}
              promptSuggestions={[
                "How does this align with recent client conversations?",
                "What local factors should we consider?",
                "Any sector-specific nuances to add?"
              ]}
            />
          </div>
          
          {/* Local context */}
          <div className="local-context">
            <h5>Local Market Context</h5>
            <ContextBuilder 
              onChange={setLocalContext}
              templates={getLocalContextTemplates()}
              recentEvents={getRecentLocalEvents()}
            />
          </div>
        </div>
        
        {/* Right: Preview and tools */}
        <div className="panel preview">
          <h4>Final Preview</h4>
          <ContentPreview 
            content={mergeEdits(research, editedContent, advisorInsights)}
            format="whatsapp"
            clientSegments={['conservative', 'moderate', 'aggressive']}
          />
          
          {/* Validation checklist */}
          <ValidationChecklist 
            content={editedContent}
            onValidation={setValidationNotes}
          />
          
          {/* Save options */}
          <SaveOptions 
            onSave={() => saveValidatedResearch(editedContent)}
            onSaveAsTemplate={() => saveAsTemplate(editedContent)}
            onSchedule={() => scheduleForLater(editedContent)}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * VOICE INSIGHT CAPTURE
 * Records and transcribes advisor voice notes
 */
const VoiceInsightCapture = ({ onInsightCaptured }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const startRecording = async () => {
    const recorder = new VoiceRecorder({
      onTranscript: (text) => setTranscript(text),
      realTimeTranscription: true,
      language: 'en-IN',
      maxDuration: 60000 // 1 minute max
    });
    
    await recorder.start();
    setIsRecording(true);
  };
  
  const stopRecording = async () => {
    const insight = await recorder.stop();
    setIsRecording(false);
    
    // Process and structure the insight
    const structured = await structureVoiceInsight(insight);
    onInsightCaptured(structured);
  };
  
  return (
    <div className="voice-insight-capture">
      <button 
        className={`record-button ${isRecording ? 'recording' : ''}`}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
      >
        {isRecording ? '🔴 Recording...' : '🎤 Hold to Record'}
      </button>
      
      {transcript && (
        <div className="transcript-preview">
          <p>{transcript}</p>
          <button onClick={() => setTranscript('')}>Clear</button>
        </div>
      )}
      
      {/* Quick prompts */}
      <div className="voice-prompts">
        <button onClick={() => speakPrompt("Client impact")}>
          💼 Client Impact
        </button>
        <button onClick={() => speakPrompt("Risk factors")}>
          ⚠️ Risk Factors
        </button>
        <button onClick={() => speakPrompt("Action items")}>
          ✅ Action Items
        </button>
      </div>
    </div>
  );
};

/**
 * BATCH PROCESSING INTERFACE
 * Handle multiple similar research items efficiently
 */
const BatchProcessor = ({ items, onBatchApprove, similarityThreshold }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  useEffect(() => {
    // Group similar items
    const grouped = groupSimilarResearch(items, similarityThreshold);
    setGroups(grouped);
  }, [items, similarityThreshold]);
  
  const handleBatchAction = (action, group) => {
    const template = createBatchTemplate(group);
    
    switch(action) {
      case 'approve-all':
        group.items.forEach(item => approveWithTemplate(item, template));
        break;
        
      case 'apply-edit':
        const edit = captureGroupEdit();
        group.items.forEach(item => applyEdit(item, edit));
        break;
        
      case 'add-context':
        const context = captureGroupContext();
        group.items.forEach(item => addContext(item, context));
        break;
    }
  };
  
  return (
    <div className="batch-processor">
      <h4>Similar Research Groups ({groups.length})</h4>
      
      {groups.map((group, idx) => (
        <div key={idx} className="research-group">
          <div className="group-header">
            <span className="topic">{group.topic}</span>
            <span className="count">{group.items.length} items</span>
            <span className="similarity">{group.similarity}% similar</span>
          </div>
          
          <div className="group-preview">
            {group.items.slice(0, 3).map(item => (
              <div key={item.id} className="preview-item">
                {item.headline}
              </div>
            ))}
            {group.items.length > 3 && (
              <div className="more">+{group.items.length - 3} more</div>
            )}
          </div>
          
          <div className="group-actions">
            <button onClick={() => handleBatchAction('approve-all', group)}>
              Approve All
            </button>
            <button onClick={() => handleBatchAction('apply-edit', group)}>
              Edit All
            </button>
            <button onClick={() => setSelectedGroup(group)}>
              Review Individual
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * VALIDATION METRICS DASHBOARD
 * Track validation performance and quality
 */
const ValidationMetrics = () => {
  const [metrics, setMetrics] = useState({
    daily: { reviewed: 0, approved: 0, edited: 0, rejected: 0 },
    weekly: { reviewed: 0, approved: 0, edited: 0, rejected: 0 },
    quality: { accuracy: 0, consistency: 0, timeliness: 0 },
    efficiency: { avgReviewTime: 0, batchProcessingRate: 0 }
  });
  
  return (
    <div className="validation-metrics">
      <div className="metric-card daily">
        <h5>Today's Progress</h5>
        <div className="progress-ring">
          <CircularProgress 
            value={metrics.daily.reviewed}
            max={50}
            label="Reviews"
          />
        </div>
        <div className="stats">
          <span>✅ {metrics.daily.approved} Approved</span>
          <span>✏️ {metrics.daily.edited} Edited</span>
          <span>❌ {metrics.daily.rejected} Rejected</span>
        </div>
      </div>
      
      <div className="metric-card efficiency">
        <h5>Efficiency</h5>
        <div className="time-stats">
          <div>Avg Review Time: {metrics.efficiency.avgReviewTime}s</div>
          <div>Batch Rate: {metrics.efficiency.batchProcessingRate}%</div>
        </div>
      </div>
      
      <div className="metric-card quality">
        <h5>Quality Score</h5>
        <QualityIndicator 
          accuracy={metrics.quality.accuracy}
          consistency={metrics.quality.consistency}
          timeliness={metrics.quality.timeliness}
        />
      </div>
    </div>
  );
};

/**
 * COLLABORATION FEATURES
 * Enable team-based validation and knowledge sharing
 */
const CollaborationPanel = ({ research, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [expertOpinions, setExpertOpinions] = useState([]);
  
  const requestExpertOpinion = async (expertType) => {
    const experts = await findAvailableExperts(expertType);
    const request = {
      research: research.id,
      requester: currentUser,
      expertType,
      priority: calculatePriority(research),
      deadline: calculateDeadline(research)
    };
    
    await notifyExperts(experts, request);
  };
  
  return (
    <div className="collaboration-panel">
      {/* Comment thread */}
      <div className="comments-section">
        <h5>Team Discussion</h5>
        <CommentThread 
          comments={comments}
          onNewComment={(comment) => addComment(research.id, comment)}
          onMention={(user) => notifyUser(user, research)}
        />
      </div>
      
      {/* Expert opinions */}
      <div className="expert-opinions">
        <h5>Expert Insights</h5>
        <div className="request-expert">
          <button onClick={() => requestExpertOpinion('sector-specialist')}>
            🎯 Sector Specialist
          </button>
          <button onClick={() => requestExpertOpinion('technical-analyst')}>
            📊 Technical Analyst
          </button>
          <button onClick={() => requestExpertOpinion('compliance-expert')}>
            ⚖️ Compliance Expert
          </button>
        </div>
        
        {expertOpinions.map(opinion => (
          <ExpertOpinionCard 
            key={opinion.id}
            opinion={opinion}
            onApply={() => applyExpertOpinion(research, opinion)}
          />
        ))}
      </div>
      
      {/* Knowledge base integration */}
      <div className="knowledge-base">
        <h5>Similar Past Research</h5>
        <SimilarResearchList 
          current={research}
          onApplyPrevious={(previous) => applyPreviousInsights(research, previous)}
        />
      </div>
    </div>
  );
};

// Export components
export {
  MobileValidationInterface,
  DetailedReviewInterface,
  VoiceInsightCapture,
  BatchProcessor,
  ValidationMetrics,
  CollaborationPanel
};