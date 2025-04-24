cask "restedxp" do
  version "4.6.69"
  sha256 "eb900fecdfa0a1ba9735283d256cd94d6bd76a7ecddd5e791f2ec834a901528c"

  url "https://github.com/RestedXP/RXPGuides/releases/download/v#{version}/RXPGuides-v#{version}-classic.zip"
  name "RestedXP"
  desc "RestedXP: WoW Classic leveling guides addon"
  homepage "https://github.com/RestedXP/RXPGuides"

  addon_dir = File.expand_path("/Applications/World of Warcraft/_classic_era_/Interface/AddOns")

  preflight do
    FileUtils.mkdir_p addon_dir unless Dir.exist?(addon_dir)
  end

  artifact "RXPGuides", target: "#{addon_dir}/RXPGuides"

  zap trash: [
    "#{addon_dir}/RXPGuides"
  ]
end
