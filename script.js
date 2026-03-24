document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const playerInput = document.getElementById('player-input');
    const bracketContainer = document.getElementById('tournament-bracket');

    generateBtn.addEventListener('click', () => {
        const players = playerInput.value.trim().split('\n').filter(name => name.trim() !== '');
        if (players.length < 2) {
            alert('Veuillez entrer au moins 2 noms.');
            return;
        }

        // Vérifie que le nombre de joueurs est une puissance de 2
        let size = 2;
        while (size < players.length) size *= 2;
        while (players.length < size) players.push('Bye'); // Ajoute des "Bye" si nécessaire

        bracketContainer.innerHTML = '';
        generateBracket(players);
    });

    function generateBracket(players) {
        let currentRoundPlayers = [...players];
        let roundNumber = 1;

        while (currentRoundPlayers.length > 1) {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'round';
            roundDiv.innerHTML = `<h3>Tour ${roundNumber}</h3>`;

            for (let i = 0; i < currentRoundPlayers.length; i += 2) {
                const player1 = currentRoundPlayers[i];
                const player2 = currentRoundPlayers[i + 1] || 'Bye';

                const matchDiv = document.createElement('div');
                matchDiv.className = 'match';
                matchDiv.innerHTML = `
                    <div class="match-name" data-player="${player1}">${player1}</div>
                    <div class="match-name" data-player="${player2}">${player2}</div>
                `;
                roundDiv.appendChild(matchDiv);

                // Ajoute l'événement de clic pour déclarer un vainqueur
                matchDiv.addEventListener('click', (e) => {
                    if (e.target.classList.contains('match-name')) {
                        const winner = e.target.getAttribute('data-player');
                        const loser = e.target.parentElement.querySelector('.match-name:not(.winner)')?.getAttribute('data-player');
                        if (winner && !e.target.classList.contains('winner')) {
                            e.target.classList.add('winner');
                            if (loser) {
                                const loserElement = e.target.parentElement.querySelector(`[data-player="${loser}"]`);
                                loserElement.style.opacity = '0.5';
                            }
                        }
                    }
                });
            }

            bracketContainer.appendChild(roundDiv);
            currentRoundPlayers = currentRoundPlayers.filter((_, index) => index % 2 === 0).map((_, index) => `Vainqueur Match ${index + 1}`);
            roundNumber++;
        }
    }
});