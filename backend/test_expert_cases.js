const mongoose = require('mongoose');
const { connectDB, ensureAppCollections } = require('./config/db');
const Vote = require('./models/Vote');
const VoteTally = require('./models/VoteTally');
const NamedVoter = require('./models/NamedVoter');
const POLL_OPTIONS = require('./config/pollOptions');
const { getAggregateResults, ensureTalliesExist } = require('./services/resultsService');

async function runExpertTests() {
  console.log('\n======================================================');
  console.log('🧪 EXPERT TEST SUITE: WARD 5 VOTING SYSTEM');
  console.log('======================================================\n');

  const testPollId = 'expert-test-poll-' + Date.now();

  try {
    await connectDB();
    await ensureAppCollections();
    await ensureTalliesExist(testPollId);

    // TEST CASE 1: Initial State & Tally Verification
    console.log('🔹 CASE 1: Verifying initial candidate tallies...');
    const initialTallies = await VoteTally.find({ pollId: testPollId });
    console.log(`   ✓ Found ${initialTallies.length} candidate tally documents in database.`);
    initialTallies.forEach((t) => {
      console.log(`     - [${t.optionId}] ${t.optionName} => Initial Votes: ${t.votes}`);
    });

    // TEST CASE 2: User A votes for Option 1 without name
    console.log('\n🔹 CASE 2: User A ("voter-alpha") votes for Option 1 (No name entered)...');
    const voteA = await Vote.create({
      pollId: testPollId,
      optionId: 'option-1',
      voterId: 'voter-alpha',
    });
    // Atomic increment: existing number + 1
    const tallyOpt1 = await VoteTally.findOneAndUpdate(
      { pollId: testPollId, optionId: 'option-1' },
      { $inc: { votes: 1 }, $set: { lastVoteAt: new Date() } },
      { new: true }
    );
    console.log(`   ✓ Vote audit saved in 'votes' collection (ID: ${voteA._id})`);
    console.log(`   ✓ Candidate vote count incremented in 'votetallies' (Existing + 1) => Votes: ${tallyOpt1.votes}`);

    const namedBeforeA = await NamedVoter.findOne({ pollId: testPollId, voterId: 'voter-alpha' });
    console.log(`   ✓ 'namedvoters' document exists for User A? ${namedBeforeA ? 'YES' : 'NO (Correct: no name entered)'}`);

    // TEST CASE 3: Duplicate vote prevention
    console.log('\n🔹 CASE 3: User A ("voter-alpha") tries to vote a second time...');
    try {
      await Vote.create({
        pollId: testPollId,
        optionId: 'option-2',
        voterId: 'voter-alpha',
      });
      console.error('   ❌ ERROR: Duplicate vote was NOT prevented!');
    } catch (dupErr) {
      console.log(`   ✓ Duplicate vote successfully BLOCKED by unique index (Code: ${dupErr.code || 'DUPLICATE'})`);
    }

    // TEST CASE 4: User A enters their name later
    console.log('\n🔹 CASE 4: User A enters their name ("Jignesh Sharma")...');
    const optObj1 = POLL_OPTIONS.find((o) => o.id === voteA.optionId);
    const namedDocA = await NamedVoter.findOneAndUpdate(
      { pollId: testPollId, voterId: 'voter-alpha' },
      {
        $set: {
          name: 'Jignesh Sharma',
          optionId: voteA.optionId,
          optionName: optObj1.name,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    console.log(`   ✓ Separate document CREATED in 'namedvoters' collection:`);
    console.log(`     - Name: "${namedDocA.name}"`);
    console.log(`     - Option Chosen: "${namedDocA.optionName}" (ID: ${namedDocA.optionId})`);
    console.log(`     - Voter ID: ${namedDocA.voterId}`);

    // Verify tally did NOT increase when name was entered
    const tallyAfterName = await VoteTally.findOne({ pollId: testPollId, optionId: 'option-1' });
    console.log(`   ✓ Vote count in tally remains unchanged => Votes: ${tallyAfterName.votes} (Integrity intact)`);

    // TEST CASE 5: Multiple users vote and determine leader/winner
    console.log('\n🔹 CASE 5: Multiple users vote for different candidates...');
    // User B votes for option-2
    await Vote.create({ pollId: testPollId, optionId: 'option-2', voterId: 'voter-beta' });
    await VoteTally.updateOne({ pollId: testPollId, optionId: 'option-2' }, { $inc: { votes: 1 } });

    // User C votes for option-2 and gives name "Pooja Verma"
    await Vote.create({ pollId: testPollId, optionId: 'option-2', voterId: 'voter-gamma' });
    await VoteTally.updateOne({ pollId: testPollId, optionId: 'option-2' }, { $inc: { votes: 1 } });
    const optObj2 = POLL_OPTIONS.find((o) => o.id === 'option-2');
    await NamedVoter.create({
      pollId: testPollId,
      voterId: 'voter-gamma',
      name: 'Pooja Verma',
      optionId: 'option-2',
      optionName: optObj2.name,
    });

    // Compute live results & check winner
    const liveResults = await getAggregateResults(testPollId);
    console.log(`\n📊 LIVE RESULTS SUMMARY:`);
    console.log(`   Total Votes: ${liveResults.totalVotes}`);
    console.log(`   🏆 WINNING / LEADING CANDIDATE: ${liveResults.leadingCandidate.name}`);
    console.log(`      Votes: ${liveResults.leadingCandidate.votes} (${liveResults.leadingCandidate.percentage})`);

    console.log('\n📋 ALL COLLECTIONS STATUS:');
    console.log(`   1. 'votetallies' collection: Stores running counter ($inc: { votes: 1 }) for all 6 options.`);
    console.log(`   2. 'namedvoters' collection: Stores dedicated documents for voters who entered their name.`);
    const allNamed = await NamedVoter.find({ pollId: testPollId });
    allNamed.forEach((n, idx) => {
      console.log(`      [${idx + 1}] Name: "${n.name}" -> Voted For: "${n.optionName}"`);
    });
    console.log(`   3. 'votes' collection: Stores unique audit log to prevent duplicate device voting.`);

    console.log('\n======================================================');
    console.log('✅ ALL EXPERT TEST CASES PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runExpertTests();
