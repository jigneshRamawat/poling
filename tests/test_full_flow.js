const { io } = require('../frontend/node_modules/socket.io-client');

const BACKEND_URL = 'http://localhost:5001';
const POLL_ID = 'ward-5-voting-test';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E2E VERIFICATION TEST');
  console.log('====================================================\n');

  // Test 1: Fetch Poll info
  console.log('TEST 1: Fetching Poll Options via GET /api/poll...');
  const pollRes = await fetch(`${BACKEND_URL}/api/poll`);
  const pollData = await pollRes.json();
  if (!pollData.success || !Array.isArray(pollData.options) || pollData.options.length === 0) {
    throw new Error('TEST 1 FAILED: Could not fetch valid poll options.');
  }
  console.log(`✅ TEST 1 PASSED: Fetched ${pollData.options.length} options for poll "${pollData.pollTitle}".`);

  // Test 2: Setup Browser B Socket.IO listener for live updates
  console.log('\nTEST 2: Setting up Client B Socket.IO listener for live results...');
  const socketB = io(BACKEND_URL, { reconnection: false });
  let clientBReceivedUpdate = false;
  let receivedResults = null;

  await new Promise((resolve) => {
    socketB.on('connect', () => {
      console.log('✅ Client B connected via Socket.IO');
      resolve();
    });
  });

  socketB.on('poll:resultsUpdated', (data) => {
    clientBReceivedUpdate = true;
    receivedResults = data;
    console.log(`📡 [Socket.IO Broadcast Received by Client B]: Total Votes = ${data.totalVotes}`);
  });

  // Test 3: Cast Vote from Client A
  const voterAId = `test-voter-a-${Date.now()}`;
  console.log(`\nTEST 3: Casting vote from Client A with voterId: ${voterAId}...`);
  const voteRes = await fetch(`${BACKEND_URL}/api/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pollId: POLL_ID,
      optionId: pollData.options[0].id,
      voterId: voterAId,
    }),
  });
  const voteData = await voteRes.json();
  if (!voteData.success || voteData.vote.optionId !== pollData.options[0].id) {
    throw new Error(`TEST 3 FAILED: Vote submission failed: ${JSON.stringify(voteData)}`);
  }
  console.log(`✅ TEST 3 PASSED: Vote saved in MongoDB. Confirmation: "${voteData.message}"`);

  // Test 4: Verify Client B received real-time Socket.IO update
  console.log('\nTEST 4: Verifying Client B real-time update...');
  await new Promise((r) => setTimeout(r, 600));
  if (!clientBReceivedUpdate || !receivedResults) {
    throw new Error('TEST 4 FAILED: Client B did not receive live Socket.IO update.');
  }
  console.log(`✅ TEST 4 PASSED: Client B received real-time results broadcast! Option 1 votes: ${receivedResults.results[0].votes}`);

  // Test 5: Optional Name Update
  const prevTotal = receivedResults.totalVotes;
  console.log(`\nTEST 5: Submitting optional voter name from Client A...`);
  const nameRes = await fetch(`${BACKEND_URL}/api/votes/name`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pollId: POLL_ID,
      voterId: voterAId,
      optionalName: 'परीक्षण मतदाता 1',
    }),
  });
  const nameData = await nameRes.json();
  if (!nameData.success || nameData.optionalName !== 'परीक्षण मतदाता 1') {
    throw new Error(`TEST 5 FAILED: Name update failed: ${JSON.stringify(nameData)}`);
  }

  // Verify total vote count did NOT increase
  const resAfterName = await fetch(`${BACKEND_URL}/api/results`);
  const resultsAfterName = await resAfterName.json();
  if (resultsAfterName.totalVotes !== prevTotal) {
    throw new Error(`TEST 5 FAILED: Name update incorrectly changed vote count from ${prevTotal} to ${resultsAfterName.totalVotes}`);
  }
  console.log(`✅ TEST 5 PASSED: Name saved without creating a new vote or incrementing vote count.`);

  // Test 6: Duplicate Vote Prevention
  console.log('\nTEST 6: Attempting duplicate vote with same voterId...');
  const dupRes = await fetch(`${BACKEND_URL}/api/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pollId: POLL_ID,
      optionId: pollData.options[1].id,
      voterId: voterAId,
    }),
  });
  const dupData = await dupRes.json();
  if (dupRes.status !== 409 || dupData.code !== 'ALREADY_VOTED') {
    throw new Error(`TEST 6 FAILED: Duplicate vote was not rejected with 409. Status: ${dupRes.status}`);
  }
  console.log(`✅ TEST 6 PASSED: Duplicate vote blocked with message: "${dupData.message}"`);

  // Test 7: Verify Voter Status endpoint
  console.log('\nTEST 7: Checking GET /api/votes/status...');
  const statusRes = await fetch(`${BACKEND_URL}/api/votes/status?voterId=${voterAId}`);
  const statusData = await statusRes.json();
  if (!statusData.hasVoted || statusData.vote.optionalName !== 'परीक्षण मतदाता 1') {
    throw new Error('TEST 7 FAILED: Voter status did not reflect recorded vote and name.');
  }
  console.log(`✅ TEST 7 PASSED: Status correctly returned hasVoted=true with recorded option and name.`);

  socketB.disconnect();

  console.log('\n====================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILED:', err.message);
  process.exit(1);
});
