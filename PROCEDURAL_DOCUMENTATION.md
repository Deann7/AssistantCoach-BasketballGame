# 🏀 Basketball Management System - Dokumentasi Prosedural

## 📋 Daftar Isi
1. [Sistem Login](#sistem-login)
2. [Sistem Register](#sistem-register)
3. [Sistem Standings](#sistem-standings)
4. [Sistem Create League](#sistem-create-league)
5. [Sistem Management Plan](#sistem-management-plan)

---

# 🔐 Sistem Login

## 📱 Frontend Flow (Login)

### 1. Komponen Login Page (`/pages/login/page.tsx`)

#### **Struktur State Management:**
```typescript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
const router = useRouter();
```

#### **Step-by-Step Login Process:**

**STEP 1: User Input Validation**
```typescript
// User mengisi form login
<input 
  type="text" 
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  placeholder="Username"
/>
<input 
  type="password" 
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Password"
/>
```

**STEP 2: Form Submission Handler**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);  // Show loading state
  setError('');        // Clear previous errors
  
  try {
    // Call API
    const response = await authAPI.login({
      username,
      password
    });
    
    // Handle success
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.user));
      router.push('/gamePage/mainMenu');
    }
  } catch (error) {
    setError('Login failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### 2. API Layer (`/lib/api.ts`)

**STEP 3: HTTP Request ke Backend**
```typescript
export const authAPI = {
  login: async (credentials: {
    username: string;
    password: string;
  }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Login failed' };
    }
  }
};
```

## 🔧 Backend Flow (Login)

### 3. Controller Layer (`AuthController.java`)

**STEP 4: Endpoint Handler**
```java
@PostMapping("/login")
public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest loginRequest) {
    Map<String, Object> response = new HashMap<>();
    
    try {
        // Step 4a: Find user by username
        User user = userRepo.findByUsername(loginRequest.getUsername());
        
        // Step 4b: Validate user exists
        if (user == null) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(401).body(response);
        }
        
        // Step 4c: Validate password
        if (!user.getPassword().equals(loginRequest.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid password");
            return ResponseEntity.status(401).body(response);
        }
        
        // Step 4d: Check if user is coach
        Optional<Coach> coach = coachRepo.findByUser_Id(user.getId());
        
        // Step 4e: Return success response
        response.put("success", true);
        response.put("message", "Login successful");
        response.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "age", user.getAge(),
                "isAssistant", coach.isPresent()));
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        response.put("success", false);
        response.put("message", "Login failed: " + e.getMessage());
        return ResponseEntity.status(500).body(response);
    }
}
```

### 4. Repository Layer

**STEP 5: Database Query**
```java
@Repository
public interface UserRepo extends JpaRepository<User, UUID> {
    User findByUsername(String username);  // Custom query method
}
```

**STEP 6: SQL Query yang Dieksekusi**
```sql
SELECT * FROM users WHERE username = ?
```

## 📊 Login Flow Diagram
```
[Frontend Form] → [API Call] → [Controller] → [Repository] → [Database]
                                    ↓
[Local Storage] ← [Response] ← [JSON Response] ← [User Entity]
```

---

# 📝 Sistem Register

## 📱 Frontend Flow (Register)

### 1. Registration Form State
```typescript
const [formData, setFormData] = useState({
  username: '',
  email: '',
  password: '',
  age: '',
  isAssistant: false
});
```

### 2. Form Submission Process

**STEP 1: Input Validation**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Frontend validation
  if (!formData.username || !formData.email || !formData.password) {
    setError('All fields are required');
    return;
  }
  
  if (formData.age < 13) {
    setError('Age must be at least 13');
    return;
  }
  
  // Call API
  try {
    const response = await authAPI.register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      age: parseInt(formData.age),
      isAssistant: formData.isAssistant
    });
    
    if (response.success) {
      router.push('/pages/login');
    }
  } catch (error) {
    setError(error.message);
  }
};
```

## 🔧 Backend Flow (Register)

### 3. Registration Controller

**STEP 2: Backend Validation & User Creation**
```java
@PostMapping("/register")
public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest registerRequest) {
    Map<String, Object> response = new HashMap<>();
    
    try {
        // Step 2a: Check username uniqueness
        if (userRepo.findByUsername(registerRequest.getUsername()) != null) {
            response.put("success", false);
            response.put("message", "Username already exists");
            return ResponseEntity.status(400).body(response);
        }
        
        // Step 2b: Check email uniqueness
        if (userRepo.findByEmail(registerRequest.getEmail()) != null) {
            response.put("success", false);
            response.put("message", "Email already exists");
            return ResponseEntity.status(400).body(response);
        }
        
        // Step 2c: Create new user
        User newUser = new User();
        newUser.setUsername(registerRequest.getUsername());
        newUser.setEmail(registerRequest.getEmail());
        newUser.setPassword(registerRequest.getPassword());
        newUser.setAge(registerRequest.getAge());
        User savedUser = userRepo.save(newUser);
        
        // Step 2d: AUTOMATIC LEAGUE CREATION
        Map<String, Object> leagueResult = createUserLeagueAutomatic(savedUser);
        
        if (!(Boolean) leagueResult.get("success")) {
            // Rollback user creation if league fails
            userRepo.delete(savedUser);
            response.put("success", false);
            response.put("message", "Registration failed: " + leagueResult.get("message"));
            return ResponseEntity.status(500).body(response);
        }
        
        // Step 2e: Create coach if isAssistant = true
        if (registerRequest.getIsAssistant() != null && registerRequest.getIsAssistant()) {
            Coach coach = new Coach();
            coach.setCoachName("John Doe");
            coach.setUser(savedUser);
            coach.setGoodEmotion(50);
            coach.setBadEmotion(50);
            coachRepo.save(coach);
        }
        
        // Step 2f: Return success response
        response.put("success", true);
        response.put("message", "User registered successfully with league!");
        response.put("user", Map.of(
                "id", savedUser.getId(),
                "username", savedUser.getUsername(),
                "email", savedUser.getEmail(),
                "age", savedUser.getAge()));
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        response.put("success", false);
        response.put("message", "Registration failed: " + e.getMessage());
        return ResponseEntity.status(500).body(response);
    }
}
```

### 4. Automatic League Creation Process

**STEP 3: createUserLeagueAutomatic Method**
```java
private Map<String, Object> createUserLeagueAutomatic(User user) {
    Map<String, Object> result = new HashMap<>();
    
    try {
        // Step 3a: Create new league
        UserLeague newLeague = new UserLeague();
        newLeague.setLeagueName("League " + user.getUsername());
        newLeague.setUserId(user.getId());
        UserLeague savedLeague = leagueRepo.save(newLeague);
        
        // Step 3b: Create user's team "Imagine"
        BasketballTeam userTeam = new BasketballTeam();
        userTeam.setTeamName("Imagine");
        userTeam.setUser(user);
        userTeam.setLeagueId(savedLeague.getId());
        userTeam.setIsUserTeam(true);
        userTeam.setWins(0);
        userTeam.setLose(0);
        basketballTeamRepo.save(userTeam);
        
        // Step 3c: Create 5 bot teams
        String[] botTeamNames = {
            "Riverlake Eagles", "Storm Breakers", 
            "Red Dragons", "Wolverines", "Golden Tigers"
        };
        
        for (String teamName : botTeamNames) {
            BasketballTeam botTeam = new BasketballTeam();
            botTeam.setTeamName(teamName);
            botTeam.setLeagueId(savedLeague.getId());
            botTeam.setIsUserTeam(false);
            botTeam.setWins(0);
            botTeam.setLose(0);
            basketballTeamRepo.save(botTeam);
        }
        
        // Step 3d: Generate players for all teams
        List<BasketballTeam> allTeams = basketballTeamRepo.findByLeagueId(savedLeague.getId());
        int totalPlayersCreated = 0;
        
        for (BasketballTeam team : allTeams) {
            totalPlayersCreated += generatePlayersForTeam(team);
        }
        
        result.put("success", true);
        result.put("leagueId", savedLeague.getId());
        result.put("teamsCreated", 6);
        result.put("playersCreated", totalPlayersCreated);
        
        return result;
        
    } catch (Exception e) {
        result.put("success", false);
        result.put("message", e.getMessage());
        return result;
    }
}
```

## 📊 Register Flow Diagram
```
[Register Form] → [API Call] → [Controller] → [User Creation]
                                    ↓
[Success Page] ← [Response] ← [League Creation] ← [Team Creation] ← [Player Generation]
```

---

# 🏆 Sistem Standings

## 📱 Frontend Flow (Standings)

### 1. Standings Component State
```typescript
const [teams, setTeams] = useState<StandingsTeam[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
```

### 2. Data Fetching Process

**STEP 1: useEffect untuk Load Data**
```typescript
useEffect(() => {
  const fetchStandings = async () => {
    try {
      setLoading(true);
      
      // Get user from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('Please login first');
        return;
      }
      
      const user = JSON.parse(userData);
      
      // Fetch standings data
      const response = await teamsAPI.getStandings(user.id);
      
      if (response.success) {
        // Transform data untuk display
        const transformedTeams = response.teams.map(team => ({
          teamId: team.id,
          teamName: team.teamName,
          wins: team.wins,
          lose: team.lose,
          color: TEAM_DISPLAY_DATA[team.teamName]?.color || "from-gray-500 to-gray-600",
          logo: TEAM_DISPLAY_DATA[team.teamName]?.logo || "⚫"
        }));
        
        // Sort by wins (descending), then by losses (ascending)
        const sortedTeams = transformedTeams.sort((a, b) => {
          if (b.wins === a.wins) {
            return a.lose - b.lose; // Fewer losses = higher rank
          }
          return b.wins - a.wins; // More wins = higher rank
        });
        
        setTeams(sortedTeams);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to fetch standings');
    } finally {
      setLoading(false);
    }
  };
  
  fetchStandings();
}, []);
```

### 3. Data Display dengan Ranking Logic
```typescript
const calculateWinPercentage = (wins: number, losses: number) => {
  const totalGames = wins + losses;
  return totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';
};

// Render standings table
{teams.map((team, index) => (
  <motion.tr key={team.teamId} className="hover:bg-gray-50">
    <td className="px-6 py-4 text-center font-bold text-lg">
      {index + 1} {/* Ranking position */}
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{team.logo}</span>
        <span className="font-semibold">{team.teamName}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-center font-semibold text-green-600">
      {team.wins}
    </td>
    <td className="px-6 py-4 text-center font-semibold text-red-600">
      {team.lose}
    </td>
    <td className="px-6 py-4 text-center font-semibold">
      {calculateWinPercentage(team.wins, team.lose)}%
    </td>
  </motion.tr>
))}
```

## 🔧 Backend Flow (Standings)

### 4. Teams Controller

**STEP 2: Backend Standings Endpoint**
```java
@GetMapping("/standings/{userId}")
public ResponseEntity<Map<String, Object>> getStandings(@PathVariable UUID userId) {
    Map<String, Object> response = new HashMap<>();
    
    try {
        // Step 2a: Get user's league ID
        Integer leagueId = leagueRepo.getUserLeagueId(userId);
        
        if (leagueId == null) {
            response.put("success", false);
            response.put("message", "No league found for user");
            return ResponseEntity.status(404).body(response);
        }
        
        // Step 2b: Get all teams in league
        List<BasketballTeam> teams = basketballTeamRepo.findByLeagueId(leagueId);
        
        // Step 2c: Sort teams by wins (desc) then losses (asc)
        teams.sort((a, b) -> {
            if (b.getWins().equals(a.getWins())) {
                return a.getLose().compareTo(b.getLose());
            }
            return b.getWins().compareTo(a.getWins());
        });
        
        // Step 2d: Create response with team data
        List<Map<String, Object>> teamData = teams.stream()
            .map(team -> {
                Map<String, Object> teamMap = new HashMap<>();
                teamMap.put("id", team.getId());
                teamMap.put("teamName", team.getTeamName());
                teamMap.put("wins", team.getWins());
                teamMap.put("lose", team.getLose());
                teamMap.put("isUserTeam", team.getIsUserTeam());
                
                // Calculate win percentage
                int totalGames = team.getWins() + team.getLose();
                double winPercentage = totalGames > 0 ? 
                    (double) team.getWins() / totalGames * 100 : 0.0;
                teamMap.put("winPercentage", winPercentage);
                
                return teamMap;
            })
            .collect(Collectors.toList());
        
        response.put("success", true);
        response.put("teams", teamData);
        response.put("message", "Standings retrieved successfully");
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        response.put("success", false);
        response.put("message", "Failed to get standings: " + e.getMessage());
        return ResponseEntity.status(500).body(response);
    }
}
```

## 📊 Standings Flow Diagram
```
[Standings Page] → [API Call] → [Controller] → [Get League ID] → [Get Teams] → [Sort Teams]
       ↓
[Display Table] ← [Transform Data] ← [JSON Response] ← [Calculate Rankings]
```

---

# 🏟️ Sistem Create League

## 🔧 Backend Flow (Automatic League Creation)

### 1. League Creation Process (Triggered during Registration)

**STEP 1: League Entity Creation**
```java
private Map<String, Object> createUserLeagueAutomatic(User user) {
    Map<String, Object> result = new HashMap<>();
    
    try {
        // Create league for user
        UserLeague newLeague = new UserLeague();
        newLeague.setLeagueName("League " + user.getUsername());
        newLeague.setUserId(user.getId());
        newLeague.setCreatedDate(LocalDateTime.now());
        newLeague.setIsActive(true);
        UserLeague savedLeague = leagueRepo.save(newLeague);
        
        // Continue with team creation...
    }
}
```

### 2. Team Generation Logic

**STEP 2: Create User Team + Bot Teams**
```java
// Create user's team first
BasketballTeam userTeam = new BasketballTeam();
userTeam.setTeamName("Imagine");
userTeam.setUser(user);
userTeam.setLeagueId(savedLeague.getId());
userTeam.setIsUserTeam(true);
userTeam.setWins(0);
userTeam.setLose(0);
userTeam.setCreatedDate(LocalDateTime.now());
basketballTeamRepo.save(userTeam);

// Create 5 bot teams
String[] botTeamNames = {
    "Riverlake Eagles", "Storm Breakers", 
    "Red Dragons", "Wolverines", "Golden Tigers"
};

for (String teamName : botTeamNames) {
    BasketballTeam botTeam = new BasketballTeam();
    botTeam.setTeamName(teamName);
    botTeam.setLeagueId(savedLeague.getId());
    botTeam.setIsUserTeam(false);
    botTeam.setWins(0);
    botTeam.setLose(0);
    botTeam.setCreatedDate(LocalDateTime.now());
    basketballTeamRepo.save(botTeam);
}
```

### 3. Player Generation Algorithm

**STEP 3: Generate Players for Each Team**
```java
private int generatePlayersForTeam(BasketballTeam team) {
    String[] positions = {"PG", "SG", "SF", "PF", "C"};
    String[] tendencies = {"POST", "THREE_POINT", "MIDRANGE"};
    String[] firstNames = {"John", "Mike", "Chris", "David", "James", "Alex", "Ryan", "Kevin"};
    String[] lastNames = {"Smith", "Johnson", "Brown", "Davis", "Wilson", "Miller", "Moore", "Taylor"};
    
    Random random = new Random();
    int playersCreated = 0;
    
    // Generate 12 players per team (5 starters + 7 bench)
    for (int i = 0; i < 12; i++) {
        Player player = new Player();
        
        // Generate random name
        String firstName = firstNames[random.nextInt(firstNames.length)];
        String lastName = lastNames[random.nextInt(lastNames.length)];
        player.setPlayerName(firstName + " " + lastName);
        
        // Assign position (ensure at least 1 player per position)
        if (i < 5) {
            player.setPlayerPosition(positions[i]); // First 5 = starting lineup
        } else {
            player.setPlayerPosition(positions[random.nextInt(positions.length)]);
        }
        
        // Generate realistic stats
        player.setPlayerAge(18 + random.nextInt(20)); // Age 18-37
        player.setPlayerHeight(175 + random.nextInt(35)); // Height 175-210cm
        player.setPlayerRating(60 + random.nextInt(35)); // Rating 60-94
        player.setPlayerTendencies(tendencies[random.nextInt(tendencies.length)]);
        
        // Set team reference
        player.setTeam(team);
        player.setCreatedDate(LocalDateTime.now());
        
        playerRepo.save(player);
        playersCreated++;
    }
    
    return playersCreated;
}
```

## 📊 League Creation Flow Diagram
```
[User Registration] → [Create User] → [Create League] → [Create Teams] → [Generate Players]
                                         ↓
[League Ready] ← [Save to DB] ← [Team Relationships] ← [Player Stats]
```

---

# ⚙️ Sistem Management Plan

## 📱 Frontend Flow (Management Plan)

### 1. Component Structure dan State Management
```typescript
interface Player {
  id: string
  name: string
  age: number
  position: Position
  height: number
  overall: number
  tendency: Tendency
  isStarter: boolean
}

const [allPlayers, setAllPlayers] = useState<Player[]>([])
const [startingLineup, setStartingLineup] = useState<Player[]>([])
const [benchPlayers, setBenchPlayers] = useState<Player[]>([])
const [loading, setLoading] = useState(true)
```

### 2. Data Fetching Process

**STEP 1: Load Player Data**
```typescript
useEffect(() => {
  const fetchTeamData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('Please login first');
        return;
      }
      
      const user = JSON.parse(userData);
      
      // Get user's team
      const teamResponse = await teamsAPI.getUserTeam(user.id);
      
      if (teamResponse.success && teamResponse.team) {
        setUserTeam(teamResponse.team);
        
        // Get team players
        const playersResponse = await playersAPI.getTeamPlayers(teamResponse.team.id);
        
        if (playersResponse.success) {
          // Convert backend data to frontend format
          const convertedPlayers = playersResponse.players.map(p => 
            convertBackendPlayer(p, false)
          );
          
          setAllPlayers(convertedPlayers);
          
          // Set initial lineup (top 5 players by overall rating)
          const sortedPlayers = [...convertedPlayers].sort((a, b) => b.overall - a.overall);
          const initialStarters = sortedPlayers.slice(0, 5);
          const initialBench = sortedPlayers.slice(5);
          
          setStartingLineup(initialStarters);
          setBenchPlayers(initialBench);
        }
      }
    } catch (error) {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };
  
  fetchTeamData();
}, []);
```

### 3. Drag & Drop System

**STEP 2: Drag and Drop Implementation**
```typescript
// Drag Source Component
const DraggablePlayer: React.FC<{ player: Player; index: number }> = ({ player, index }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'player',
    item: { player, index, sourceList: 'bench' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`player-card ${isDragging ? 'dragging' : ''}`}
    >
      {/* Player display content */}
    </div>
  );
};

// Drop Target Component
const DroppableLineupSlot: React.FC<{ position: Position; player?: Player }> = ({ position, player }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'player',
    drop: (item: { player: Player; index: number; sourceList: string }) => {
      handlePlayerDrop(item.player, position);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`lineup-slot ${isOver ? 'drop-target' : ''}`}
    >
      {player ? <PlayerCard player={player} /> : <EmptySlot position={position} />}
    </div>
  );
};
```

### 4. Lineup Management Logic

**STEP 3: Handle Player Swaps**
```typescript
const handlePlayerDrop = (droppedPlayer: Player, targetPosition: Position) => {
  // Check if position is valid for player
  if (droppedPlayer.position !== targetPosition) {
    setError(`${droppedPlayer.name} cannot play ${targetPosition} position`);
    return;
  }
  
  setStartingLineup(prev => {
    const newLineup = [...prev];
    
    // Find if target position is occupied
    const targetIndex = newLineup.findIndex(p => p.position === targetPosition);
    
    if (targetIndex !== -1) {
      // Swap players
      const currentPlayer = newLineup[targetIndex];
      
      // Move current player to bench
      setBenchPlayers(prevBench => {
        const newBench = prevBench.filter(p => p.id !== droppedPlayer.id);
        return [...newBench, currentPlayer].sort((a, b) => b.overall - a.overall);
      });
      
      // Put dropped player in lineup
      newLineup[targetIndex] = droppedPlayer;
    } else {
      // Add to empty position
      newLineup.push(droppedPlayer);
      
      // Remove from bench
      setBenchPlayers(prev => prev.filter(p => p.id !== droppedPlayer.id));
    }
    
    return newLineup;
  });
};
```

### 5. Formation System

**STEP 4: Lineup Validation & Formation Display**
```typescript
const getFormationDisplay = () => {
  const positions = {
    'PG': startingLineup.find(p => p.position === 'PG'),
    'SG': startingLineup.find(p => p.position === 'SG'),
    'SF': startingLineup.find(p => p.position === 'SF'),
    'PF': startingLineup.find(p => p.position === 'PF'),
    'C': startingLineup.find(p => p.position === 'C')
  };
  
  return (
    <div className="formation-court">
      <div className="backcourt">
        <DroppableLineupSlot position="PG" player={positions.PG} />
        <DroppableLineupSlot position="SG" player={positions.SG} />
      </div>
      <div className="frontcourt">
        <DroppableLineupSlot position="SF" player={positions.SF} />
        <DroppableLineupSlot position="PF" player={positions.PF} />
        <DroppableLineupSlot position="C" player={positions.C} />
      </div>
    </div>
  );
};

const validateLineup = () => {
  const requiredPositions = ['PG', 'SG', 'SF', 'PF', 'C'];
  const filledPositions = startingLineup.map(p => p.position);
  
  const missingPositions = requiredPositions.filter(pos => 
    !filledPositions.includes(pos)
  );
  
  if (missingPositions.length > 0) {
    setError(`Missing positions: ${missingPositions.join(', ')}`);
    return false;
  }
  
  return true;
};
```

## 🔧 Backend Flow (Management Plan)

### 6. Player Data API

**STEP 5: Get Team Players Endpoint**
```java
@GetMapping("/team/{teamId}/players")
public ResponseEntity<Map<String, Object>> getTeamPlayers(@PathVariable UUID teamId) {
    Map<String, Object> response = new HashMap<>();
    
    try {
        // Get team to verify it exists
        Optional<BasketballTeam> team = basketballTeamRepo.findById(teamId);
        
        if (team.isEmpty()) {
            response.put("success", false);
            response.put("message", "Team not found");
            return ResponseEntity.status(404).body(response);
        }
        
        // Get all players for the team
        List<Player> players = playerRepo.findByTeam_Id(teamId);
        
        // Sort players by overall rating (descending)
        players.sort((a, b) -> b.getPlayerRating().compareTo(a.getPlayerRating()));
        
        // Convert to response format
        List<Map<String, Object>> playerData = players.stream()
            .map(player -> {
                Map<String, Object> playerMap = new HashMap<>();
                playerMap.put("id", player.getId());
                playerMap.put("playerName", player.getPlayerName());
                playerMap.put("playerAge", player.getPlayerAge());
                playerMap.put("playerPosition", player.getPlayerPosition());
                playerMap.put("playerHeight", player.getPlayerHeight());
                playerMap.put("playerRating", player.getPlayerRating());
                playerMap.put("playerTendencies", player.getPlayerTendencies());
                
                // Get player stats if available
                Optional<Stats> stats = statsRepo.findByPlayer_Id(player.getId());
                if (stats.isPresent()) {
                    Map<String, Object> statsMap = new HashMap<>();
                    statsMap.put("points", stats.get().getPoints());
                    statsMap.put("rebounds", stats.get().getRebounds());
                    statsMap.put("assists", stats.get().getAssists());
                    statsMap.put("gamesPlayed", stats.get().getGamesPlayed());
                    playerMap.put("stats", statsMap);
                }
                
                return playerMap;
            })
            .collect(Collectors.toList());
        
        response.put("success", true);
        response.put("players", playerData);
        response.put("totalPlayers", players.size());
        response.put("message", "Players retrieved successfully");
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        response.put("success", false);
        response.put("message", "Failed to get team players: " + e.getMessage());
        return ResponseEntity.status(500).body(response);
    }
}
```

### 7. Save Lineup Configuration

**STEP 6: Update Starting Lineup**
```java
@PostMapping("/team/{teamId}/lineup")
public ResponseEntity<Map<String, Object>> updateStartingLineup(
    @PathVariable UUID teamId,
    @RequestBody Map<String, List<String>> lineupData) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
        List<String> starterIds = lineupData.get("starters");
        
        if (starterIds.size() != 5) {
            response.put("success", false);
            response.put("message", "Starting lineup must have exactly 5 players");
            return ResponseEntity.badRequest().body(response);
        }
        
        // Reset all players in team to bench
        List<Player> allPlayers = playerRepo.findByTeam_Id(teamId);
        allPlayers.forEach(player -> {
            player.setIsStarter(false);
            playerRepo.save(player);
        });
        
        // Set selected players as starters
        for (String playerId : starterIds) {
            Optional<Player> player = playerRepo.findById(UUID.fromString(playerId));
            if (player.isPresent()) {
                player.get().setIsStarter(true);
                playerRepo.save(player.get());
            }
        }
        
        response.put("success", true);
        response.put("message", "Starting lineup updated successfully");
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        response.put("success", false);
        response.put("message", "Failed to update lineup: " + e.getMessage());
        return ResponseEntity.status(500).body(response);
    }
}
```

## 📊 Management Plan Flow Diagram
```
[Management Page] → [Load Players] → [Display Formation] → [Drag & Drop] → [Validate] → [Save Lineup]
       ↓                ↓                    ↓               ↓           ↓           ↓
[Position Check] ← [Player Stats] ← [Court Display] ← [Swap Logic] ← [API Call] ← [Database Update]
```

---

## 🎯 Key Technical Highlights

### 1. **State Management Complexity**
- Multiple interconnected states (players, lineup, bench)
- Real-time validation dan error handling
- Optimistic updates dengan rollback capability

### 2. **Advanced UI Interactions**
- Drag & Drop dengan React DnD
- Position-based validation
- Visual feedback untuk user actions

### 3. **Data Transformation**
- Backend ↔ Frontend data mapping
- Complex sorting dan filtering logic
- Real-time statistics calculation

### 4. **Database Design**
- Relational data dengan proper foreign keys
- Transaction handling untuk data consistency
- Optimized queries untuk performance

### 5. **Error Handling**
- Frontend validation before API calls
- Backend validation dengan proper HTTP codes
- User-friendly error messages

---

## 🚀 Performance Optimizations

### Frontend:
- **useMemo** untuk expensive calculations
- **useCallback** untuk event handlers
- **Lazy loading** untuk large player lists
- **Debounced** API calls

### Backend:
- **JPA Query Optimization** dengan custom queries
- **Transactional** operations untuk data consistency
- **Connection Pooling** untuk database performance
- **Caching** untuk frequently accessed data

---

**Dokumentasi ini menunjukkan pemahaman mendalam tentang full-stack development dengan focus pada user experience, data consistency, dan scalable architecture.** 🏀
